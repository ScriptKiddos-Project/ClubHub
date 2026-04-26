import prisma from '../config/database';
import { AppError } from '../utils/AppError';

const WEIGHTS = {
  attendanceRate: 0.3,
  eventsHeld: 0.25,
  memberEngagement: 0.2,
  feedbackScore: 0.15,
  socialActivity: 0.1,
} as const;

const TIER_THRESHOLDS = {
  gold: 75,
  silver: 50,
  bronze: 25,
} as const;

const round1 = (value: number) => Math.round(value * 10) / 10;
const clamp100 = (value: number) => Math.max(0, Math.min(100, value));
const attendedStatuses = ['present', 'late', 'left_early'] as const;
const attendedStatusSet = new Set<string>(attendedStatuses);

function computeTier(score: number): string {
  if (score >= TIER_THRESHOLDS.gold) return 'gold';
  if (score >= TIER_THRESHOLDS.silver) return 'silver';
  if (score >= TIER_THRESHOLDS.bronze) return 'bronze';
  return 'unranked';
}

function formatClock(date: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(11, 16);
}

async function computeClubScore(clubId: string): Promise<{
  attendanceRate: number;
  eventsHeld: number;
  memberEngagement: number;
  feedbackScore: number;
  socialActivity: number;
  totalScore: number;
  tier: string;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [club, recentEvents, totalMembers, activeAttendance] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubId },
      select: {
        website_url: true,
        instagram_url: true,
        linkedin_url: true,
        twitter_url: true,
        tags: true,
        skill_areas: true,
      },
    }),
    // FIX: include all fields needed — is_featured, skill_areas, registration_count, capacity
    // and registrations with explicit type so it's not `never`
    prisma.event.findMany({
      where: {
        club_id: clubId,
        date: { gte: thirtyDaysAgo, lte: now },
        is_published: true,
      },
      select: {
        id: true,
        capacity: true,
        registration_count: true,
        is_featured: true,       // FIX: was missing from select → typed as never
        skill_areas: true,       // FIX: was missing from select → typed as never
        tags: true,
        registrations: {
          select: {
            user_id: true,
            status: true,
          },
        },
      },
    }),
    prisma.userClub.count({
      where: { club_id: clubId },
    }),
    prisma.eventRegistration.findMany({
      where: {
        status: { in: [...attendedStatuses] },
        event: {
          club_id: clubId,
          date: { gte: thirtyDaysAgo, lte: now },
        },
      },
      select: { user_id: true },
      distinct: ['user_id'],
    }),
  ]);

  if (!club) {
    throw new AppError('Club not found', 404, 'CLUB_NOT_FOUND');
  }

  // FIX: registrations is now properly typed — .length works
  const totalRegistrations = recentEvents.reduce(
    (sum, event) => sum + event.registrations.length,
    0,
  );
  const totalPresent = recentEvents.reduce(
    (sum, event) =>
      sum +
      event.registrations.filter((r) => attendedStatusSet.has(r.status)).length,
    0,
  );
  const attendanceRateRaw =
    totalRegistrations > 0 ? (totalPresent / totalRegistrations) * 100 : 0;

  const eventsHeldRaw = clamp100(recentEvents.length * 10);

  const memberEngagementRaw =
    totalMembers > 0 ? (activeAttendance.length / totalMembers) * 100 : 0;

  const avgFillRate =
    recentEvents.length > 0
      ? recentEvents.reduce(
          (sum, event) =>
            sum + Math.min(1, event.registration_count / Math.max(1, event.capacity)),
          0,
        ) / recentEvents.length
      : 0;
  const feedbackScoreRaw = recentEvents.length > 0 ? avgFillRate * 100 : 50;

  const socialLinksCount = [
    club.website_url,
    club.instagram_url,
    club.linkedin_url,
    club.twitter_url,
  ].filter(Boolean).length;
  const contentSignals = club.tags.length + club.skill_areas.length;
  // FIX: is_featured now available because it's in the select above
  const featuredEvents = recentEvents.filter((event) => event.is_featured).length;
  const socialActivityRaw = clamp100(
    socialLinksCount * 20 +
      Math.min(20, contentSignals * 4) +
      featuredEvents * 10 +
      recentEvents.length * 3,
  );

  const totalScore =
    attendanceRateRaw * WEIGHTS.attendanceRate +
    eventsHeldRaw * WEIGHTS.eventsHeld +
    memberEngagementRaw * WEIGHTS.memberEngagement +
    feedbackScoreRaw * WEIGHTS.feedbackScore +
    socialActivityRaw * WEIGHTS.socialActivity;

  return {
    attendanceRate: round1(attendanceRateRaw),
    eventsHeld: round1(eventsHeldRaw),
    memberEngagement: round1(memberEngagementRaw),
    feedbackScore: round1(feedbackScoreRaw),
    socialActivity: round1(socialActivityRaw),
    totalScore: round1(totalScore),
    tier: computeTier(totalScore),
  };
}

export async function runNightlyRankingJob(): Promise<void> {
  const clubs = await prisma.club.findMany({
    where: { status: 'approved' },
    select: { id: true },
  });

  const scores = await Promise.all(
    clubs.map(async (club) => ({
      clubId: club.id,
      ...(await computeClubScore(club.id)),
    })),
  );

  scores.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.memberEngagement !== a.memberEngagement)
      return b.memberEngagement - a.memberEngagement;
    return b.attendanceRate - a.attendanceRate;
  });

  await prisma.$transaction(
    scores.flatMap((score, index) => {
      const rank = index + 1;

      return [
        // FIX: use prisma.club_ranking_snapshots (camelCase) — Prisma maps
        // snake_case model names to camelCase on the client.
        // `club_ranking_snapshots` model → `prisma.club_ranking_snapshots`
        prisma.club_ranking_snapshots.create({
          data: {
            club_id: score.clubId,
            ranking_score: score.totalScore,
            rank,
            attendance_rate: score.attendanceRate,
            events_held: score.eventsHeld,
            member_engagement: score.memberEngagement,
            feedback_score: score.feedbackScore,
            social_activity: score.socialActivity,
            tier: score.tier,
          },
        }),
        prisma.club.update({
          where: { id: score.clubId },
          // FIX: ranking_score, ranking_tier, ranking_rank are now in schema
          data: {
            ranking_score: score.totalScore,
            ranking_tier: score.tier,
            ranking_rank: rank,
          },
        }),
      ];
    }),
  );
}

export async function getRankingBreakdown(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      ranking_rank: true,
      ranking_score: true,
      ranking_tier: true,
      updated_at: true,
    },
  });

  if (!club) {
    throw new AppError('Club not found', 404, 'CLUB_NOT_FOUND');
  }

  const [scores, snapshots] = await Promise.all([
    computeClubScore(clubId),
    // FIX: prisma.club_ranking_snapshots (camelCase)
    prisma.club_ranking_snapshots.findMany({
      where: { club_id: clubId },
      orderBy: { computed_at: 'desc' },
      take: 2,
      select: { rank: true, computed_at: true },
    }),
  ]);

  const previousSnapshot = snapshots[1];

  return {
    ...scores,
    rank: club.ranking_rank ?? 0,
    previousRank: previousSnapshot?.rank,
    updatedAt: (snapshots[0]?.computed_at ?? club.updated_at).toISOString(),
  };
}

export async function getRankingHistory(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true },
  });

  if (!club) {
    throw new AppError('Club not found', 404, 'CLUB_NOT_FOUND');
  }

  // FIX: prisma.club_ranking_snapshots (camelCase)
  const snapshots = await prisma.club_ranking_snapshots.findMany({
    where: { club_id: clubId },
    orderBy: { computed_at: 'asc' },
    take: 30,
    select: { ranking_score: true, rank: true, computed_at: true },
  });

  return snapshots.map((snapshot) => ({
    date: snapshot.computed_at.toISOString().slice(0, 10),
    score: snapshot.ranking_score,
    rank: snapshot.rank,
  }));
}

export async function getLeaderboard(params: {
  page?: number;
  limit?: number;
  tier?: string;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const skip = (page - 1) * limit;

  const where = {
    status: 'approved' as const,
    ...(params.tier ? { ranking_tier: params.tier } : {}),
  };

  const [clubs, total] = await Promise.all([
    prisma.club.findMany({
      where,
      orderBy: [
        { ranking_rank: 'asc' },
        { ranking_score: 'desc' },
        { member_count: 'desc' },
      ],
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        logo_url: true,
        member_count: true,
        ranking_score: true,
        ranking_tier: true,
        ranking_rank: true,
      },
    }),
    prisma.club.count({ where }),
  ]);

  // FIX: prisma.club_ranking_snapshots (camelCase)
  const previousSnapshots = await prisma.club_ranking_snapshots.findMany({
    where: { club_id: { in: clubs.map((club) => club.id) } },
    orderBy: [{ club_id: 'asc' }, { computed_at: 'desc' }],
    select: { club_id: true, rank: true },
  });

  const previousRankMap = new Map<string, number | undefined>();
  const seenCounts = new Map<string, number>();
  for (const snapshot of previousSnapshots) {
    const count = (seenCounts.get(snapshot.club_id) ?? 0) + 1;
    seenCounts.set(snapshot.club_id, count);
    if (count === 2) {
      previousRankMap.set(snapshot.club_id, snapshot.rank);
    }
  }

  return {
    data: clubs.map((club) => ({
      id: club.id,
      name: club.name,
      slug: club.slug,
      category: club.category,
      logoUrl: club.logo_url ?? undefined,
      memberCount: club.member_count,
      rankingScore: club.ranking_score,
      tier: club.ranking_tier as string,
      rank: club.ranking_rank ?? 0,
      previousRank: previousRankMap.get(club.id),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getFeaturedEvents(limit = 6) {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      is_published: true,
      date: { gte: now, lte: thirtyDaysLater },
    },
    // FIX: use explicit select so skill_areas and is_featured are included
    select: {
      id: true,
      club_id: true,
      title: true,
      date: true,
      end_date: true,
      venue: true,
      capacity: true,
      registration_count: true,
      event_type: true,
      tags: true,
      skill_areas: true,       // FIX: was missing from include
      is_featured: true,       // FIX: was missing from include
      points_reward: true,
      volunteer_hours: true,
      banner_url: true,
      created_at: true,
      club: {
        select: {
          name: true,
          logo_url: true,
        },
      },
    },
    take: Math.max(limit * 4, 12),
  });

  const scored = events.map((event) => {
    const fillRate =
      event.capacity > 0 ? event.registration_count / event.capacity : 0;
    const hoursUntilEvent =
      (event.date.getTime() - now.getTime()) / (1000 * 60 * 60);
    const recencyBoost = Math.max(0, 1 - hoursUntilEvent / (30 * 24));
    // FIX: skill_areas and is_featured now typed correctly
    const tagBoost = Math.min(
      0.1,
      event.tags.length * 0.02 + event.skill_areas.length * 0.02,
    );
    const featuredBoost = event.is_featured ? 0.15 : 0;
    const engagementScore =
      (fillRate + recencyBoost + tagBoost + featuredBoost) * 100;

    return { ...event, engagementScore };
  });

  scored.sort((a, b) => b.engagementScore - a.engagementScore);

  return scored.slice(0, limit).map((event) => ({
    id: event.id,
    title: event.title,
    clubId: event.club_id,
    club: {
      name: event.club.name,
      logoUrl: event.club.logo_url ?? undefined,
    },
    date: event.date.toISOString(),
    startTime: formatClock(event.date),
    endTime: formatClock(event.end_date ?? event.date),
    venue: event.venue,
    capacity: event.capacity,
    registrationCount: event.registration_count,
    eventType: event.event_type,
    tags: event.tags,
    // FIX: skill_areas now typed correctly
    skillAreas: event.skill_areas,
    pointsReward: event.points_reward,
    volunteerHours: event.volunteer_hours,
    heroImageUrl: event.banner_url ?? undefined,
    engagementScore: round1(event.engagementScore),
    isFeatured: true as const,
    createdAt: event.created_at.toISOString(),
  }));
}