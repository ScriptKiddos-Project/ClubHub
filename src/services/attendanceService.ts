import { PrismaClient, AttendanceStatus, AttendanceMethod, NotificationType } from '@prisma/client';
import getRedis from '../config/redis';
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
  BulkAttendanceItem,
} from '../types';

const prisma = new PrismaClient();
const redis = getRedis();

// ── Redis Key Factories ───────────────────────────────────────────────────────
const PIN_KEY = (eventId: string) => `pin:event:${eventId}`;
const PIN_ATTEMPTS_KEY = (eventId: string, userId: string) => `pin:attempts:${eventId}:${userId}`;
const QR_USED_KEY = (qrCodeId: string, userId: string) => `qr:used:${qrCodeId}:${userId}`;

const PIN_TTL_SECONDS = 3600;      // 1 hour
const PIN_MAX_ATTEMPTS = 5;

// ── QR Code Generation ────────────────────────────────────────────────────────
export async function generateQRCode(eventId: string, actorId: string) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  if (!event.qr_attendance_enabled) {
    throw Object.assign(new Error('QR attendance is not enabled for this event'), { status: 400 });
  }

  const windowMinutes = 60;
  const { payload, signature } = buildQRPayload(eventId, windowMinutes);
  const qrData = encodeQRData(payload, signature);

  await prisma.eventQrCode.create({
    data: {
      event_id: eventId,
      qr_code_id: payload.qrCodeId,
      valid_from: new Date(payload.validFrom * 1000),
      valid_until: new Date(payload.validUntil * 1000),
      hmac_signature: signature,
      scan_count: 0,
      created_by: actorId,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'QR_CODE_GENERATED',
      actor_id: actorId,
      target_type: 'Event',
      target_id: eventId,
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

  if (!verifyQRSignature(payload, signature)) {
    throw Object.assign(new Error('QR code signature is invalid'), { status: 400 });
  }

  if (!isQRTimeWindowValid(payload)) {
    throw Object.assign(new Error('QR code has expired or is not yet valid'), { status: 400 });
  }

  const usedKey = QR_USED_KEY(payload.qrCodeId, userId);
  const alreadyUsed = await redis.get(usedKey);
  if (alreadyUsed) {
    throw Object.assign(new Error('QR code already used for attendance'), { status: 409 });
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { event_id_user_id: { event_id: payload.eventId, user_id: userId } },
    include: { event: { include: { club: true } }, user: true },
  });

  if (!registration) {
    throw Object.assign(new Error('You are not registered for this event'), { status: 403 });
  }

  if (registration.attended) {
    throw Object.assign(new Error('Attendance already marked for this event'), { status: 409 });
  }

  const ttl = payload.validUntil - Math.floor(Date.now() / 1000) + 300;
  await redis.setex(usedKey, Math.max(ttl, 60), '1');

  const status = _determineAttendanceStatus(registration.event.date);

  await prisma.eventRegistration.update({
    where: { event_id_user_id: { event_id: payload.eventId, user_id: userId } },
    data: { attended: true, status },
  });

  await prisma.eventQrCode.update({
    where: { qr_code_id: payload.qrCodeId },
    data: { scan_count: { increment: 1 } },
  });

  await _createAttendanceLog({
    event_id: payload.eventId,
    user_id: userId,
    status,
    changed_by: userId,
    old_status: null,
    method: AttendanceMethod.qr,
  });

  const awarded = await _awardPointsAndHours(userId, registration.event);

  await notificationQueue.add(NotificationJobType.IN_APP, {
    userId,
    title: 'Attendance Confirmed ✅',
    body: `Your attendance for "${registration.event.title}" has been marked as ${status}.`,
    type: NotificationType.attendance_marked,
  });

  return { status, pointsAwarded: awarded.points, hoursAwarded: awarded.hours };
}

// ── PIN Generation ────────────────────────────────────────────────────────────
export async function generatePINForEvent(eventId: string, actorId: string) {
  await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  const pin = generatePIN(6);
  const pinHash = hashPIN(pin);

  await redis.setex(PIN_KEY(eventId), PIN_TTL_SECONDS, pinHash);

  await prisma.auditLog.create({
    data: {
      action: 'PIN_GENERATED',
      actor_id: actorId,
      target_type: 'Event',
      target_id: eventId,
      metadata: { expiresInSeconds: PIN_TTL_SECONDS },
    },
  });

  return { pin, expiresAt: new Date(Date.now() + PIN_TTL_SECONDS * 1000) };
}

// ── PIN Attendance ────────────────────────────────────────────────────────────
export async function markPINAttendance(eventId: string, pin: string, userId: string) {
  const attemptsKey = PIN_ATTEMPTS_KEY(eventId, userId);
  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) await redis.expire(attemptsKey, 900);

  if (attempts > PIN_MAX_ATTEMPTS) {
    throw Object.assign(
      new Error('Too many PIN attempts. Try again in 15 minutes.'),
      { status: 429 }
    );
  }

  const storedHash = await redis.get(PIN_KEY(eventId));
  if (!storedHash) {
    throw Object.assign(new Error('No active PIN for this event or PIN has expired'), { status: 404 });
  }

  if (!verifyPIN(pin, storedHash)) {
    throw Object.assign(new Error('Incorrect PIN'), { status: 400 });
  }

  await redis.del(attemptsKey);

  const registration = await prisma.eventRegistration.findUnique({
    where: { event_id_user_id: { event_id: eventId, user_id: userId } },
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
    where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    data: { attended: true, status },
  });

  await _createAttendanceLog({
    event_id: eventId,
    user_id: userId,
    status,
    changed_by: userId,
    old_status: null,
    method: AttendanceMethod.pin,
  });

  const awarded = await _awardPointsAndHours(userId, registration.event);

  await notificationQueue.add(NotificationJobType.IN_APP, {
    userId,
    title: 'Attendance Confirmed ✅',
    body: `Your attendance for "${registration.event.title}" has been marked via PIN.`,
    type: NotificationType.attendance_marked,
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
    where: { event_id_user_id: { event_id: eventId, user_id: targetUserId } },
    include: { event: { include: { club: true } } },
  });

  if (!registration) {
    throw Object.assign(new Error('User is not registered for this event'), { status: 404 });
  }

  const oldStatus = registration.status as AttendanceStatus;
  const wasAttended = registration.attended;

  await prisma.eventRegistration.update({
    where: { event_id_user_id: { event_id: eventId, user_id: targetUserId } },
    data: {
      status,
      attended: status === AttendanceStatus.present || status === AttendanceStatus.late,
    },
  });

  await _createAttendanceLog({
    event_id: eventId,
    user_id: targetUserId,
    status,
    changed_by: actorId,
    old_status: oldStatus,
    method: AttendanceMethod.manual,
  });

  let awarded = { points: 0, hours: 0 };
  const isNowAttended = status === AttendanceStatus.present || status === AttendanceStatus.late;
  if (isNowAttended && !wasAttended) {
    awarded = await _awardPointsAndHours(targetUserId, registration.event);
  }

  await notificationQueue.add(NotificationJobType.IN_APP, {
    userId: targetUserId,
    title: 'Attendance Updated',
    body: `Your attendance for "${registration.event.title}" has been updated to: ${status}.`,
    type: NotificationType.attendance_marked,
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

  const BATCH_SIZE = 50;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async ({ userId, status }) => {
        try {
          const registration = await prisma.eventRegistration.findUnique({
            where: { event_id_user_id: { event_id: eventId, user_id: userId } },
          });

          if (!registration) {
            results.push({ userId, status, success: false, error: 'Not registered' });
            return;
          }

          const oldStatus = registration.status as AttendanceStatus;
          const wasAttended = registration.attended;

          await prisma.eventRegistration.update({
            where: { event_id_user_id: { event_id: eventId, user_id: userId } },
            data: {
              status,
              attended: status === AttendanceStatus.present || status === AttendanceStatus.late,
            },
          });

          await _createAttendanceLog({
            event_id: eventId,
            user_id: userId,
            status,
            changed_by: actorId,
            old_status: oldStatus,
            method: AttendanceMethod.manual,
          });

          const isNowAttended = status === AttendanceStatus.present || status === AttendanceStatus.late;
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
    where: { event_id: eventId },
    include: {
      user: { select: { id: true, name: true, email: true, department: true } },
    },
    orderBy: { registered_at: 'asc' },
  });

  const logs = await prisma.attendanceLog.findMany({
    where: { event_id: eventId },
    orderBy: { changed_at: 'desc' },
  });

  const logsByUser = logs.reduce<Record<string, typeof logs[0]>>((acc, log) => {
    if (!acc[log.user_id]) acc[log.user_id] = log;
    return acc;
  }, {});

  const report = registrations.map(reg => ({
    userId: reg.user.id,
    name: reg.user.name,
    email: reg.user.email,
    department: reg.user.department,
    status: reg.status,
    attended: reg.attended,
    pointsAwarded: reg.points_awarded,
    markedAt: logsByUser[reg.user_id]?.changed_at ?? null,
    method: logsByUser[reg.user_id]?.method ?? null,
  }));

  const summary = {
    total: registrations.length,
    present: registrations.filter(r => r.status === AttendanceStatus.present).length,
    late: registrations.filter(r => r.status === AttendanceStatus.late).length,
    absent: registrations.filter(r => r.status === AttendanceStatus.absent).length,
    leftEarly: registrations.filter(r => r.status === AttendanceStatus.left_early).length,
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
  if (diffMinutes > 15) return AttendanceStatus.late;
  return AttendanceStatus.present;
}

interface AttendanceLogEntry {
  event_id: string;
  user_id: string;
  status: AttendanceStatus;
  changed_by: string;
  old_status: AttendanceStatus | null;
  method: AttendanceMethod;
}

async function _createAttendanceLog(entry: AttendanceLogEntry) {
  return prisma.attendanceLog.create({
    data: {
      event_id: entry.event_id,
      user_id: entry.user_id,
      new_status: entry.status,
      changed_by: entry.changed_by,
      changed_at: new Date(),
      old_status: entry.old_status,
      method: entry.method,
    },
  });
}

async function _awardPointsAndHours(userId: string, event: any): Promise<{ points: number; hours: number }> {
  const pointsToAward = event.points_reward ?? 0;
  const hoursToAward = event.volunteer_hours ?? 0;

  if (pointsToAward === 0 && hoursToAward === 0) {
    return { points: 0, hours: 0 };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      total_points: { increment: pointsToAward },
      total_volunteer_hours: { increment: hoursToAward },
    },
  });

  await prisma.eventRegistration.update({
    where: { event_id_user_id: { event_id: event.id, user_id: userId } },
    data: { points_awarded: pointsToAward },
  });

  return { points: pointsToAward, hours: hoursToAward };
}