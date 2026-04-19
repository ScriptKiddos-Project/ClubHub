import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import { notificationQueue, emailQueue, EmailJobType, NotificationJobType } from '../config/queues';
import {
  buildQRPayload,
  encodeQRData,
  decodeQRData,
  verifyQRSignature,
  isQRTimeWindowValid,
  generatePIN,
  hashPIN,
  verifyPIN,
} from '../utils/qrGenerator';
import {
  AttendanceStatus,
  AttendanceMethod,
  BulkAttendanceItem,
  AttendanceLogEntry,
  NotificationType,
} from '../types';

const prisma = new PrismaClient();

// ── Redis Key Factories ───────────────────────────────────────────────────────
const PIN_KEY = (eventId: string) => `pin:event:${eventId}`;
const PIN_ATTEMPTS_KEY = (eventId: string, userId: string) => `pin:attempts:${eventId}:${userId}`;
const QR_USED_KEY = (qrCodeId: string, userId: string) => `qr:used:${qrCodeId}:${userId}`;

const PIN_TTL_SECONDS = 3600;      // 1 hour
const PIN_MAX_ATTEMPTS = 5;

// ── QR Code Generation ────────────────────────────────────────────────────────
export async function generateQRCode(eventId: string, actorId: string) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  if (!event.qrAttendanceEnabled) {
    throw Object.assign(new Error('QR attendance is not enabled for this event'), { status: 400 });
  }

  const windowMinutes = 60;
  const { payload, signature } = buildQRPayload(eventId, windowMinutes);
  const qrData = encodeQRData(payload, signature);

  const qrRecord = await prisma.eventQrCode.create({
    data: {
      eventId,
      qrCodeId: payload.qrCodeId,
      validFrom: new Date(payload.validFrom * 1000),
      validUntil: new Date(payload.validUntil * 1000),
      hmacSignature: signature,
      scanCount: 0,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'QR_CODE_GENERATED',
      actorId,
      targetType: 'Event',
      targetId: eventId,
      metadata: { qrCodeId: payload.qrCodeId, validUntil: payload.validUntil },
    },
  });

  return { qrData, qrCodeId: payload.qrCodeId, validUntil: new Date(payload.validUntil * 1000) };
}

// ── QR Attendance Validation ──────────────────────────────────────────────────
export async function markQRAttendance(rawQrData: string, userId: string) {
  const decoded = decodeQRData(rawQrData);
  if (!decoded) {
    throw Object.assign(new Error('Invalid QR code format'), { status: 400 });
  }

  const { payload, signature } = decoded;

  // 1. HMAC signature check
  if (!verifyQRSignature(payload, signature)) {
    throw Object.assign(new Error('QR code signature is invalid'), { status: 400 });
  }

  // 2. Time window check
  if (!isQRTimeWindowValid(payload)) {
    throw Object.assign(new Error('QR code has expired or is not yet valid'), { status: 400 });
  }

  // 3. Replay attack prevention: check if this user already used this QR
  const usedKey = QR_USED_KEY(payload.qrCodeId, userId);
  const alreadyUsed = await redis.get(usedKey);
  if (alreadyUsed) {
    throw Object.assign(new Error('QR code already used for attendance'), { status: 409 });
  }

  // 4. Verify student is registered for event
  const registration = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: payload.eventId, userId } },
    include: { event: { include: { club: true } }, user: true },
  });

  if (!registration) {
    throw Object.assign(new Error('You are not registered for this event'), { status: 403 });
  }

  // 5. Check if attendance already marked
  if (registration.attended) {
    throw Object.assign(new Error('Attendance already marked for this event'), { status: 409 });
  }

  // 6. Mark replay key in Redis (TTL = until QR expiry + buffer)
  const ttl = payload.validUntil - Math.floor(Date.now() / 1000) + 300;
  await redis.setex(usedKey, Math.max(ttl, 60), '1');

  // 7. Determine status (if event started > 15min ago, mark Late)
  const status = _determineAttendanceStatus(registration.event.date);

  // 8. Update registration
  await prisma.eventRegistration.update({
    where: { eventId_userId: { eventId: payload.eventId, userId } },
    data: { attended: true, status },
  });

  // 9. Increment QR scan count
  await prisma.eventQrCode.update({
    where: { qrCodeId: payload.qrCodeId },
    data: { scanCount: { increment: 1 } },
  });

  // 10. Log attendance
  await _createAttendanceLog({
    eventId: payload.eventId,
    userId,
    status,
    changedBy: userId,
    oldStatus: null,
    method: AttendanceMethod.QR,
  });

  // 11. Award points
  const awarded = await _awardPointsAndHours(userId, registration.event);

  // 12. Send in-app notification
  await notificationQueue.add(NotificationJobType.IN_APP, {
    userId,
    title: 'Attendance Confirmed ✅',
    body: `Your attendance for "${registration.event.title}" has been marked as ${status}.`,
    type: NotificationType.ATTENDANCE_MARKED,
  });

  return { status, pointsAwarded: awarded.points, hoursAwarded: awarded.hours };
}

// ── PIN Generation ────────────────────────────────────────────────────────────
export async function generatePINForEvent(eventId: string, actorId: string) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  const pin = generatePIN(6);
  const pinHash = hashPIN(pin);

  // Store hashed PIN in Redis with TTL tied to event window
  await redis.setex(PIN_KEY(eventId), PIN_TTL_SECONDS, pinHash);

  await prisma.auditLog.create({
    data: {
      action: 'PIN_GENERATED',
      actorId,
      targetType: 'Event',
      targetId: eventId,
      metadata: { expiresInSeconds: PIN_TTL_SECONDS },
    },
  });

  return { pin, expiresAt: new Date(Date.now() + PIN_TTL_SECONDS * 1000) };
}

// ── PIN Attendance ────────────────────────────────────────────────────────────
export async function markPINAttendance(eventId: string, pin: string, userId: string) {
  // 1. Brute-force protection
  const attemptsKey = PIN_ATTEMPTS_KEY(eventId, userId);
  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) await redis.expire(attemptsKey, 900); // 15-min window

  if (attempts > PIN_MAX_ATTEMPTS) {
    throw Object.assign(
      new Error('Too many PIN attempts. Try again in 15 minutes.'),
      { status: 429 }
    );
  }

  // 2. Fetch stored PIN hash
  const storedHash = await redis.get(PIN_KEY(eventId));
  if (!storedHash) {
    throw Object.assign(new Error('No active PIN for this event or PIN has expired'), { status: 404 });
  }

  // 3. Verify PIN
  if (!verifyPIN(pin, storedHash)) {
    throw Object.assign(new Error('Incorrect PIN'), { status: 400 });
  }

  // 4. Reset attempts on success
  await redis.del(attemptsKey);

  // 5. Verify registration
  const registration = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId } },
    include: { event: { include: { club: true } }, user: true },
  });

  if (!registration) {
    throw Object.assign(new Error('You are not registered for this event'), { status: 403 });
  }

  if (registration.attended) {
    throw Object.assign(new Error('Attendance already marked for this event'), { status: 409 });
  }

  const status = _determineAttendanceStatus(registration.event.date);

  await prisma.eventRegistration.update({
    where: { eventId_userId: { eventId, userId } },
    data: { attended: true, status },
  });

  await _createAttendanceLog({
    eventId,
    userId,
    status,
    changedBy: userId,
    oldStatus: null,
    method: AttendanceMethod.PIN,
  });

  const awarded = await _awardPointsAndHours(userId, registration.event);

  await notificationQueue.add(NotificationJobType.IN_APP, {
    userId,
    title: 'Attendance Confirmed ✅',
    body: `Your attendance for "${registration.event.title}" has been marked via PIN.`,
    type: NotificationType.ATTENDANCE_MARKED,
  });

  return { status, pointsAwarded: awarded.points, hoursAwarded: awarded.hours };
}

// ── Manual Attendance ─────────────────────────────────────────────────────────
export async function markManualAttendance(
  eventId: string,
  targetUserId: string,
  status: AttendanceStatus,
  actorId: string
) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: targetUserId } },
    include: { event: { include: { club: true } } },
  });

  if (!registration) {
    throw Object.assign(new Error('User is not registered for this event'), { status: 404 });
  }

  const oldStatus = registration.status as AttendanceStatus;
  const wasAttended = registration.attended;

  await prisma.eventRegistration.update({
    where: { eventId_userId: { eventId, userId: targetUserId } },
    data: {
      status,
      attended: status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE,
    },
  });

  await _createAttendanceLog({
    eventId,
    userId: targetUserId,
    status,
    changedBy: actorId,
    oldStatus,
    method: AttendanceMethod.MANUAL,
  });

  // Award points if newly marking as attended
  let awarded = { points: 0, hours: 0 };
  const isNowAttended = status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE;
  if (isNowAttended && !wasAttended) {
    awarded = await _awardPointsAndHours(targetUserId, registration.event);
  }

  // Notify student
  await notificationQueue.add(NotificationJobType.IN_APP, {
    userId: targetUserId,
    title: 'Attendance Updated',
    body: `Your attendance for "${registration.event.title}" has been updated to: ${status}.`,
    type: NotificationType.ATTENDANCE_MARKED,
  });

  return { status, pointsAwarded: awarded.points, hoursAwarded: awarded.hours };
}

// ── Bulk Attendance ───────────────────────────────────────────────────────────
export async function markBulkAttendance(
  eventId: string,
  items: BulkAttendanceItem[],
  actorId: string
) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  const results: { userId: string; status: string; success: boolean; error?: string }[] = [];

  // Process in batches to avoid DB overload
  const BATCH_SIZE = 50;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async ({ userId, status }) => {
        try {
          const registration = await prisma.eventRegistration.findUnique({
            where: { eventId_userId: { eventId, userId } },
          });

          if (!registration) {
            results.push({ userId, status, success: false, error: 'Not registered' });
            return;
          }

          const oldStatus = registration.status as AttendanceStatus;
          const wasAttended = registration.attended;

          await prisma.eventRegistration.update({
            where: { eventId_userId: { eventId, userId } },
            data: {
              status,
              attended: status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE,
            },
          });

          await _createAttendanceLog({
            eventId,
            userId,
            status,
            changedBy: actorId,
            oldStatus,
            method: AttendanceMethod.MANUAL,
          });

          const isNowAttended = status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE;
          if (isNowAttended && !wasAttended) {
            await _awardPointsAndHours(userId, event);
          }

          results.push({ userId, status, success: true });
        } catch (err: any) {
          results.push({ userId, status, success: false, error: err.message });
        }
      })
    );
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return { total: items.length, succeeded, failed, results };
}

// ── Attendance Report ─────────────────────────────────────────────────────────
export async function getAttendanceReport(eventId: string) {
  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, email: true, department: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const logs = await prisma.attendanceLog.findMany({
    where: { eventId },
    orderBy: { changedAt: 'desc' },
  });

  const logsByUser = logs.reduce<Record<string, typeof logs[0]>>((acc, log) => {
    if (!acc[log.userId]) acc[log.userId] = log;
    return acc;
  }, {});

  const report = registrations.map(reg => ({
    userId: reg.user.id,
    name: reg.user.name,
    email: reg.user.email,
    department: reg.user.department,
    status: reg.status,
    attended: reg.attended,
    pointsAwarded: reg.pointsAwarded,
    markedAt: logsByUser[reg.userId]?.changedAt ?? null,
    method: logsByUser[reg.userId]?.method ?? null,
  }));

  const summary = {
    total: registrations.length,
    present: registrations.filter(r => r.status === AttendanceStatus.PRESENT).length,
    late: registrations.filter(r => r.status === AttendanceStatus.LATE).length,
    absent: registrations.filter(r => r.status === AttendanceStatus.ABSENT).length,
    leftEarly: registrations.filter(r => r.status === AttendanceStatus.LEFT_EARLY).length,
    attendanceRate:
      registrations.length > 0
        ? Math.round(
            (registrations.filter(r => r.attended).length / registrations.length) * 100
          )
        : 0,
  };

  return { summary, report };
}

// ── Internal Helpers ──────────────────────────────────────────────────────────
function _determineAttendanceStatus(eventDate: Date): AttendanceStatus {
  const now = new Date();
  const diffMinutes = (now.getTime() - eventDate.getTime()) / 60000;
  if (diffMinutes > 15) return AttendanceStatus.LATE;
  return AttendanceStatus.PRESENT;
}

async function _createAttendanceLog(entry: AttendanceLogEntry) {
  return prisma.attendanceLog.create({
    data: {
      eventId: entry.eventId,
      userId: entry.userId,
      status: entry.status,
      changedBy: entry.changedBy,
      changedAt: new Date(),
      oldStatus: entry.oldStatus,
      method: entry.method,
    },
  });
}

async function _awardPointsAndHours(userId: string, event: any): Promise<{ points: number; hours: number }> {
  const pointsToAward = event.pointsReward ?? 0;
  const hoursToAward = event.volunteerHours ?? 0;

  if (pointsToAward === 0 && hoursToAward === 0) {
    return { points: 0, hours: 0 };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      totalPoints: { increment: pointsToAward },
      totalVolunteerHours: { increment: hoursToAward },
    },
  });

  await prisma.eventRegistration.update({
    where: { eventId_userId: { eventId: event.id, userId } },
    data: { pointsAwarded: true },
  });

  return { points: pointsToAward, hours: hoursToAward };
}
