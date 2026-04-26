import { PrismaClient } from '@prisma/client';
import getRedis from '../config/redis';

const redis = getRedis();
const prisma = new PrismaClient();

const CACHE_TTL = 60 * 60; // 1 hour

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecommendedEvent {
  eventId: string;
  title: string;
  date: Date;
  score: number;
  reason: string;
}

interface UserSignals {
  clubIds: string[];
  attendedEventIds: string[];
  department: string;
  year: number;
  tags: string[];
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export async function getRecommendationsForUser(userId: string): Promise<RecommendedEvent[]> {
  const cacheKey = `recommendations:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as RecommendedEvent[];

  const signals = await getUserSignals(userId);

  if (signals.attendedEventIds.length === 0 && signals.clubIds.length === 0) {
    const recommendations = await getColdStartRecommendations(signals.department, signals.year);
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(recommendations));
    return recommendations;
  }

  const [collaborative, contentBased] = await Promise.all([
    getCollaborativeFilteringRecommendations(userId, signals),
    getContentBasedRecommendations(signals),
  ]);

  const merged = mergeAndRank([...collaborative, ...contentBased], signals.attendedEventIds);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(merged));
  return merged;
}

// ─── User Signal Extraction ──────────────────────────────────────────────────

async function getUserSignals(userId: string): Promise<UserSignals> {
  // Schema: User.clubs → UserClub[] (relation name is "clubs")
  // Schema: User.event_registrations → EventRegistration[]
  // Schema: UserClub.club_id is the FK field
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      department: true,
      enrollment_year: true,
      clubs: { select: { club_id: true } },
      event_registrations: { where: { attended: true }, select: { event_id: true } },
    },
  });

  const attendedEventIds = user.event_registrations.map((r) => r.event_id);

  const attendedEvents = await prisma.event.findMany({
    where: { id: { in: attendedEventIds } },
    select: { tags: true },
  });

  const tags = [...new Set(attendedEvents.flatMap((e) => e.tags))];

  return {
    clubIds: user.clubs.map((uc) => uc.club_id),
    attendedEventIds,
    department: user.department ?? '',
    year: user.enrollment_year ?? 1,
    tags,
  };
}

// ─── Collaborative Filtering ─────────────────────────────────────────────────

async function getCollaborativeFilteringRecommendations(
  userId: string,
  signals: UserSignals
): Promise<RecommendedEvent[]> {
  // Schema: EventRegistration table is "event_registrations"; fields: user_id, event_id, attended
  const similarUsers = await prisma.$queryRaw<{ user_id: string; overlap: bigint }[]>`
    SELECT a2.user_id, COUNT(*) AS overlap
    FROM "event_registrations" a1
    JOIN "event_registrations" a2
      ON a1.event_id = a2.event_id AND a2.user_id != ${userId}
    WHERE a1.user_id = ${userId}
      AND a1.attended = true
      AND a2.attended = true
    GROUP BY a2.user_id
    ORDER BY overlap DESC
    LIMIT 20
  `;

  if (similarUsers.length === 0) return [];

  const similarIds = similarUsers.map((u) => u.user_id);

  // Schema: Event.registrations → EventRegistration[] (relation name "registrations")
  const upcoming = await prisma.event.findMany({
    where: {
      date: { gte: new Date() },
      is_published: true,
      id: { notIn: signals.attendedEventIds },
      registrations: { some: { user_id: { in: similarIds }, attended: true } },
    },
    select: { id: true, title: true, date: true },
    take: 10,
    orderBy: { date: 'asc' },
  });

  return upcoming.map((event) => ({
    eventId: event.id,
    title: event.title,
    date: event.date,
    score: 0.8,
    reason: 'Students with similar interests attended this',
  }));
}

// ─── Content-Based Filtering ─────────────────────────────────────────────────

async function getContentBasedRecommendations(signals: UserSignals): Promise<RecommendedEvent[]> {
  const results: RecommendedEvent[] = [];

  if (signals.clubIds.length > 0) {
    const clubEvents = await prisma.event.findMany({
      where: {
        club_id: { in: signals.clubIds },
        date: { gte: new Date() },
        is_published: true,
        id: { notIn: signals.attendedEventIds },
      },
      select: { id: true, title: true, date: true },
      take: 5,
      orderBy: { date: 'asc' },
    });
    results.push(
      ...clubEvents.map((event) => ({
        eventId: event.id,
        title: event.title,
        date: event.date,
        score: 0.9,
        reason: "From a club you're a member of",
      }))
    );
  }

  if (signals.tags.length > 0) {
    const taggedEvents = await prisma.event.findMany({
      where: {
        tags: { hasSome: signals.tags },
        date: { gte: new Date() },
        is_published: true,
        id: { notIn: signals.attendedEventIds },
      },
      select: { id: true, title: true, date: true },
      take: 5,
      orderBy: { date: 'asc' },
    });
    results.push(
      ...taggedEvents.map((event) => ({
        eventId: event.id,
        title: event.title,
        date: event.date,
        score: 0.7,
        reason: 'Matches topics you have attended before',
      }))
    );
  }

  return results;
}

// ─── Cold Start ──────────────────────────────────────────────────────────────

async function getColdStartRecommendations(
  department: string,
  year: number
): Promise<RecommendedEvent[]> {
  // Schema: Event.registration_count (snake_case cached counter)
  const [trendingEvents, deptEvents] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: new Date() }, is_published: true },
      select: { id: true, title: true, date: true },
      orderBy: { registration_count: 'desc' },
      take: 5,
    }),
    prisma.event.findMany({
      where: {
        date: { gte: new Date() },
        is_published: true,
        OR: [
          { tags: { has: department.toLowerCase() } },
          { tags: { has: `year-${year}` } },
        ],
      },
      select: { id: true, title: true, date: true },
      take: 5,
      orderBy: { date: 'asc' },
    }),
  ]);

  const combined = [
    ...trendingEvents.map((e) => ({ eventId: e.id, title: e.title, date: e.date, score: 0.6, reason: 'Trending on campus' })),
    ...deptEvents.map((e) => ({ eventId: e.id, title: e.title, date: e.date, score: 0.65, reason: 'Popular with your department' })),
  ];

  return mergeAndRank(combined, []);
}

// ─── Merge & Deduplicate ─────────────────────────────────────────────────────

function mergeAndRank(items: RecommendedEvent[], excludeIds: string[]): RecommendedEvent[] {
  const seen = new Set<string>(excludeIds);
  const unique: RecommendedEvent[] = [];
  for (const item of items) {
    if (!seen.has(item.eventId)) {
      seen.add(item.eventId);
      unique.push(item);
    }
  }
  return unique.sort((a, b) => b.score - a.score).slice(0, 10);
}

// ─── Cache Invalidation ───────────────────────────────────────────────────────

export async function invalidateRecommendationCache(userId: string): Promise<void> {
  await redis.del(`recommendations:${userId}`);
}