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

  const [totalUsers, totalClubs, totalEvents, attendanceStats] = await Promise.all([
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
    select: { id: true, title: true, registration_count: true, date: true },
  });

  const result = { totalUsers, totalClubs, totalEvents, totalAttendance: attendanceStats._count.id, attendanceRate, topEvents };
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
      select: { id: true, title: true, date: true, registration_count: true, capacity: true },
      orderBy: { date: 'desc' },
    }),
    prisma.eventRegistration.findMany({
      where: { event: { club_id: clubId } },
      select: { attended: true },
    }),
  ]);

  const totalRegistrations = registrations.length;
  const attended = registrations.filter((r) => r.attended).length;
  const attendanceRate =
    totalRegistrations > 0 ? Math.round((attended / totalRegistrations) * 100) : 0;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const memberGrowth = await prisma.userClub.groupBy({
    by: ['joined_at'],
    where: { club_id: clubId, joined_at: { gte: sixMonthsAgo } },
    _count: { user_id: true },
    orderBy: { joined_at: 'asc' },
  });

  const result = { memberCount, totalEvents: events.length, attendanceRate, events, memberGrowth };
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  return result;
};

// ─── Student Analytics ────────────────────────────────────────────────────────

export const getStudentStats = async (userId: string) => {
  const cacheKey = `analytics:student:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [user, registrations, clubMemberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { total_points: true, total_volunteer_hours: true },
    }),
    prisma.eventRegistration.findMany({
      where: { user_id: userId },
      select: {
        attended: true,
        points_awarded: true,
        event: { select: { id: true, title: true, date: true, points_reward: true } },
      },
      orderBy: { event: { date: 'desc' } },
    }),
    prisma.userClub.count({ where: { user_id: userId } }),
  ]);

  const totalRegistrations = registrations.length;
  const attended = registrations.filter((r) => r.attended).length;
  const attendanceRate =
    totalRegistrations > 0 ? Math.round((attended / totalRegistrations) * 100) : 0;

  const pointsHistory = registrations
    .filter((r) => r.attended && r.points_awarded > 0)
    .slice(0, 10)
    .map((r) => ({ eventId: r.event.id, eventTitle: r.event.title, date: r.event.date, points: r.points_awarded }));

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

// ─── Cache Invalidation ───────────────────────────────────────────────────────

export const invalidateGlobalCache = async () => redis.del('analytics:global');
export const invalidateClubCache = async (clubId: string) => redis.del(`analytics:club:${clubId}`);
export const invalidateStudentCache = async (userId: string) => redis.del(`analytics:student:${userId}`);

// ─── Phase 5 — Club Performance Analytics ────────────────────────────────────

export async function getClubPerformanceAnalytics(clubId: string) {
  // Schema: Event.registrations → EventRegistration[]
  // Schema: Event._count.registrations is valid
  const [events, memberHistory] = await Promise.all([
    prisma.event.findMany({
      where: { club_id: clubId },
      select: {
        id: true,
        title: true,
        date: true,
        registrations: { select: { attended: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.userClub.findMany({
      where: { club_id: clubId },
      select: { joined_at: true },
      orderBy: { joined_at: 'asc' },
    }),
  ]);

  const totalRegistrations = events.reduce((sum, e) => sum + e._count.registrations, 0);
  const totalAttended = events.reduce(
    (sum, e) => sum + e.registrations.filter((r) => r.attended).length,
    0
  );
  const engagementRate =
    totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;

  const successfulEvents = events.filter((e) => {
    const reg = e._count.registrations;
    const att = e.registrations.filter((r) => r.attended).length;
    return reg > 0 && att / reg >= 0.7;
  });
  const eventSuccessRate =
    events.length > 0 ? Math.round((successfulEvents.length / events.length) * 100) : 0;

  const dropOffRate =
    totalRegistrations > 0
      ? Math.round(((totalRegistrations - totalAttended) / totalRegistrations) * 100)
      : 0;

  const memberGrowth = buildMonthlySeries(memberHistory.map((m) => m.joined_at));

  const eventBreakdown = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    registrations: e._count.registrations,
    attended: e.registrations.filter((r) => r.attended).length,
  }));

  return { summary: { totalEvents: events.length, totalRegistrations, totalAttended, engagementRate, eventSuccessRate, dropOffRate }, memberGrowth, eventBreakdown };
}

// ─── Phase 5 — Member Engagement Scores ──────────────────────────────────────

export async function getMemberEngagementScores(clubId: string) {
  // Schema: UserClub has user_id FK and user User relation
  // Schema: User.event_registrations → EventRegistration[]
  const userClubs = await prisma.userClub.findMany({
    where: { club_id: clubId },
    select: {
      joined_at: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          event_registrations: {
            where: { event: { club_id: clubId }, attended: true },
            select: { id: true },
          },
        },
      },
    },
  });

  const now = new Date();

  const scores = userClubs.map((uc) => {
    const tenureDays = Math.max(
      1,
      Math.floor((now.getTime() - uc.joined_at.getTime()) / (1000 * 60 * 60 * 24))
    );
    const eventsAttended = uc.user.event_registrations.length;
    // Formula from blueprint: (events_attended*2 + meetings_attended*3) / tenure_days
    const rawScore = (eventsAttended * 2 + eventsAttended * 3) / tenureDays;
    const score = Math.round(rawScore * 100) / 100;
    const badge: 'Active' | 'Moderate' | 'Inactive' =
      score >= 0.3 ? 'Active' : score >= 0.1 ? 'Moderate' : 'Inactive';

    return {
      userId: uc.user.id,
      name: uc.user.name,
      email: uc.user.email,
      department: uc.user.department,
      joinedAt: uc.joined_at,
      tenureDays,
      eventsAttended,
      engagementScore: score,
      badge,
    };
  });

  return scores.sort((a, b) => b.engagementScore - a.engagementScore);
}

// ─── Phase 5 — Campus Trends ─────────────────────────────────────────────────

export async function getCampusTrends() {
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [trendingEvents, topClub, topPerformers] = await Promise.all([
    // Schema: Event.registrations → EventRegistration; EventRegistration.registered_at exists
    prisma.event.findMany({
      where: {
        is_published: true,
        date: { gte: new Date() },
        registrations: { some: { registered_at: { gte: seventyTwoHoursAgo } } },
      },
      select: {
        id: true,
        title: true,
        date: true,
        registration_count: true,
        club: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { registration_count: 'desc' },
      take: 5,
    }),

    // Schema: Club.members → UserClub[]; Club.member_count exists
    prisma.club.findFirst({
      where: {
        status: 'approved',
        members: { some: { joined_at: { gte: thirtyDaysAgo } } },
      },
      select: {
        id: true,
        name: true,
        member_count: true,
        _count: { select: { members: true } },
      },
      orderBy: { member_count: 'desc' },
    }),

    // Schema: User.event_registrations → EventRegistration; registered_at exists on EventRegistration
    prisma.user.findMany({
      where: {
        event_registrations: {
          some: { attended: true, registered_at: { gte: thirtyDaysAgo } },
        },
      },
      select: { id: true, name: true, department: true, total_points: true },
      orderBy: { total_points: 'desc' },
      take: 10,
    }),
  ]);

  return {
    trendingEvents: trendingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      club: e.club.name,
      registrations: e._count.registrations,
    })),
    mostPopularClub: topClub
      ? {
          id: topClub.id,
          name: topClub.name,
          memberCount: topClub.member_count,
          newMembersThisMonth: topClub._count.members,
        }
      : null,
    topPerformers: topPerformers.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      name: u.name,
      department: u.department,
      totalPoints: u.total_points,
    })),
  };
}

// ─── Phase 5 — Academic Year Progression (cron) ───────────────────────────────

export async function progressAcademicYear(): Promise<void> {
  // enrollment_year is the correct field per schema
  await prisma.user.updateMany({
    where: { enrollment_year: { lt: 4 } },
    data: { enrollment_year: { increment: 1 } },
  });
  console.log('[CRON] Academic year progressed for all eligible users');
}

// ─── Phase 5 — Materialized View Refresh (cron) ───────────────────────────────

export async function refreshAnalyticsMaterializedViews(): Promise<void> {
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY club_analytics_mv`;
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY campus_trends_mv`;
  console.log('[CRON] Materialized views refreshed');
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildMonthlySeries(dates: Date[]): { month: string; count: number }[] {
  const map = new Map<string, number>();
  for (const d of dates) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}