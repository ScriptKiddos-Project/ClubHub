import { PrismaClient } from '@prisma/client';
import getRedis from '../config/redis';
const redis = getRedis();

const prisma = new PrismaClient();

const CACHE_TTL = 300; // 5 minutes

// ─── Global Analytics (Super Admin) ──────────────────────────────────────────

export const getGlobalAnalytics = async () => {
  const cacheKey = 'analytics:global';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [totalUsers, totalClubs, totalEvents, attendanceStats] =
    await Promise.all([
      prisma.user.count(),
      prisma.club.count({ where: { status: 'approved' } }),
      prisma.event.count(),
      prisma.eventRegistration.aggregate({
        _count: { id: true },
        where: { attended: true },
      }),
    ]);

  const totalRegistrations = await prisma.eventRegistration.count();
  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((attendanceStats._count.id / totalRegistrations) * 100)
      : 0;

  const topEvents = await prisma.event.findMany({
    take: 5,
    orderBy: { registration_count: 'desc' },
    select: {
      id: true,
      title: true,
      registration_count: true,
      date: true,
    },
  });

  const result = {
    totalUsers,
    totalClubs,
    totalEvents,
    totalAttendance: attendanceStats._count.id,
    attendanceRate,
    topEvents,
  };

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  return result;
};

// ─── Club Analytics (Secretary / Event Manager) ───────────────────────────────

export const getClubAnalytics = async (clubId: string) => {
  const cacheKey = `analytics:club:${clubId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [memberCount, events, registrations] = await Promise.all([
    prisma.userClub.count({ where: { club_id: clubId } }),
    prisma.event.findMany({
      where: { club_id: clubId },
      select: {
        id: true,
        title: true,
        date: true,
        registration_count: true,
        capacity: true,
      },
      orderBy: { date: 'desc' },
    }),
    prisma.eventRegistration.findMany({
      where: {
        event: { club_id: clubId },
      },
      select: { attended: true },
    }),
  ]);

  const totalRegistrations = registrations.length;
  const attended = registrations.filter((r) => r.attended).length;
  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((attended / totalRegistrations) * 100)
      : 0;

  // Member count over last 6 months (monthly snapshots)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const memberGrowth = await prisma.userClub.groupBy({
    by: ['joined_at'],
    where: {
      club_id: clubId,
      joined_at: { gte: sixMonthsAgo },
    },
    _count: { user_id: true },
    orderBy: { joined_at: 'asc' },
  });

  const result = {
    memberCount,
    totalEvents: events.length,
    attendanceRate,
    events,
    memberGrowth,
  };

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  return result;
};

// ─── Student Analytics (Student) ─────────────────────────────────────────────

export const getStudentStats = async (userId: string) => {
  const cacheKey = `analytics:student:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [user, registrations, clubMemberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        total_points: true,
        total_volunteer_hours: true,
      },
    }),
    prisma.eventRegistration.findMany({
      where: { user_id: userId },
      select: {
        attended: true,
        points_awarded: true,
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            points_reward: true,
          },
        },
      },
      orderBy: { event: { date: 'desc' } },
    }),
    prisma.userClub.count({ where: { user_id: userId } }),
  ]);

  const totalRegistrations = registrations.length;
  const attended = registrations.filter((r) => r.attended).length;
  const attendanceRate =
    totalRegistrations > 0
      ? Math.round((attended / totalRegistrations) * 100)
      : 0;

  // Points history — last 10 attended events
  const pointsHistory = registrations
    .filter((r) => r.attended && r.points_awarded > 0)
    .slice(0, 10)
    .map((r) => ({
      eventId: r.event.id,
      eventTitle: r.event.title,
      date: r.event.date,
      points: r.points_awarded,
    }));

  const result = {
    totalPoints: user?.total_points ?? 0,
    totalVolunteerHours: user?.total_volunteer_hours ?? 0,
    totalEventsAttended: attended,
    totalEventsRegistered: totalRegistrations,
    attendanceRate,
    clubMemberships,
    pointsHistory,
  };

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  return result;
};

// ─── Cache invalidation helpers ───────────────────────────────────────────────

export const invalidateGlobalCache = async () => {
  await redis.del('analytics:global');
};

export const invalidateClubCache = async (clubId: string) => {
  await redis.del(`analytics:club:${clubId}`);
};

export const invalidateStudentCache = async (userId: string) => {
  await redis.del(`analytics:student:${userId}`);
};