// src/services/geoAttendanceService.ts
// Phase 3 — Geo-fence attendance with AICTE multipliers

import { PrismaClient, AttendanceMethod, AttendanceStatus, NotificationType } from '@prisma/client';
// import { isWithinGeoFence, getAICTEMultiplier } from '../utils/geoUtils';
import { isWithinGeoFence, getAICTEMultiplier, haversineDistance } from '../utils/geoUtils';
import { notificationQueue, NotificationJobType } from '../config/queues';
import { certificateQueue } from '../config/queues';

const prisma = new PrismaClient();

// ── Geo-fence Attendance ──────────────────────────────────────────────────────

export async function markGeoAttendance(
  eventId: string,
  userId: string,
  studentLat: number,
  studentLon: number
) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  if (!event.geo_attendance_enabled) {
    throw Object.assign(
      new Error('Geo-fence attendance is not enabled for this event'),
      { status: 400 }
    );
  }

  if (event.venue_lat == null || event.venue_lng == null || event.geo_fence_radius == null) {
    throw Object.assign(
      new Error('Venue GPS coordinates are not configured for this event'),
      { status: 400 }
    );
  }

  const distanceMetres = haversineDistance(studentLat, studentLon, event.venue_lat, event.venue_lng) as number;
  //   studentLat,
  //   studentLon,
  //   event.venue_lat,
  //   event.venue_lng
  // ) as number;

  if (!isWithinGeoFence(studentLat, studentLon, event.venue_lat, event.venue_lng, event.geo_fence_radius)) {
    throw Object.assign(
      new Error(
        `You are ${Math.round(distanceMetres)} m from the venue. Must be within ${event.geo_fence_radius} m.`
      ),
      { status: 403, distanceMetres, radiusMetres: event.geo_fence_radius }
    );
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { event_id_user_id: { event_id: eventId, user_id: userId } },
  });

  if (!registration) {
    throw Object.assign(new Error('You are not registered for this event'), { status: 403 });
  }

  if (registration.attended) {
    throw Object.assign(new Error('Attendance already marked for this event'), { status: 409 });
  }

  const now = new Date();
  const diffMin = (now.getTime() - event.date.getTime()) / 60_000;
  const status: AttendanceStatus = diffMin > 15 ? AttendanceStatus.late : AttendanceStatus.present;

  await prisma.eventRegistration.update({
    where: { event_id_user_id: { event_id: eventId, user_id: userId } },
    data: { attended: true, status },
  });

  await prisma.attendanceLog.create({
    data: {
      event_id: eventId,
      user_id: userId,
      changed_by: userId,
      new_status: status,
      old_status: null,
      method: AttendanceMethod.geo,
      metadata: { lat: studentLat, lng: studentLon, distanceMetres },
    },
  });

  const awarded = await _awardWithMultiplier(userId, event);

  await notificationQueue.add(NotificationJobType.IN_APP, {
    userId,
    title: 'Geo Attendance Confirmed 📍',
    body: `You are ${Math.round(distanceMetres)} m from the venue. Attendance marked as ${status}.`,
    type: NotificationType.attendance_marked,
  });

  // Queue certificate generation
  await certificateQueue.add('generate-certificate', {
    userId,
    eventId,
    clubId: event.club_id,
    pointsAwarded: awarded.points,
    hoursAwarded: awarded.hours,
    multiplier: awarded.multiplier,
    tier: awarded.tier,
  });

  return { status, distanceMetres, ...awarded };
}

// ── AICTE Multiplier Points Award ─────────────────────────────────────────────

/**
 * Determines the user's club role for this event's club, applies the correct
 * AICTE multiplier, persists points & hours, and records in points_history.
 */
export async function _awardWithMultiplier(
  userId: string,
  event: { id: string; club_id: string; points_reward: number | null; volunteer_hours: number | null }
): Promise<{ points: number; hours: number; multiplier: number; tier: string }> {
  const base_points = event.points_reward ?? 0;
  const base_hours  = event.volunteer_hours ?? 0;

  if (base_points === 0 && base_hours === 0) {
    return { points: 0, hours: 0, multiplier: 1.0, tier: 'non_member' };
  }

  // Get user's global role and club-specific role
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } });
  const userClub = await prisma.userClub.findUnique({
    where: { user_id_club_id: { user_id: userId, club_id: event.club_id } },
    select: { role: true },
  });

  const { pointsMultiplier, hoursMultiplier, tier } = getAICTEMultiplier(user.role, userClub?.role ?? null);

  const finalPoints = parseFloat((base_points * pointsMultiplier).toFixed(2));
  const finalHours  = parseFloat((base_hours  * hoursMultiplier ).toFixed(2));

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        total_points:          { increment: finalPoints },
        total_volunteer_hours: { increment: finalHours },
      },
    }),
    prisma.eventRegistration.update({
      where: { event_id_user_id: { event_id: event.id, user_id: userId } },
      data: { points_awarded: finalPoints, hours_awarded: finalHours },
    }),
    prisma.pointsHistory.create({
      data: {
        user_id:    userId,
        event_id:   event.id,
        points:     finalPoints,
        hours:      finalHours,
        reason:     `Attended event (${tier} tier)`,
        multiplier: pointsMultiplier,
      },
    }),
  ]);

  return { points: finalPoints, hours: finalHours, multiplier: pointsMultiplier, tier };
}
