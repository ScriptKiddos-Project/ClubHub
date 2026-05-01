import prisma from '../config/database';
import { AppError } from '../utils/AppError';

const WEIGHTS = {
  attendanceRate:    0.3,
  eventsHeld:        0.25,
  memberEngagement:  0.2,
  feedbackScore:     0.15,
  socialActivity:    0.1,
} as const;

// ─── Tier thresholds are now RANK-RELATIVE, not score-absolute ───────────────
// Top 20% of approved clubs → gold
// Next 30% → silver
// Next 30% → bronze
// Bottom 20% → unranked
//
// This guarantees there are always gold clubs as long as ≥1 approved club
// exists, and reflects real competitive standing rather than arbitrary
// absolute score cutoffs that are structurally unreachable given the
// scoring formula.
// const TIER_PERCENTILES = {
//   gold:   0.20,
//   silver: 0.50,   // cumulative: top 50%
//   bronze: 0.80,   // cumulative: top 80%
// } as const;

const round1     = (value: number) => Math.round(value * 10) / 10;
const clamp100   = (value: number) => Math.max(0, Math.min(100, value));
const attendedStatuses    = ['present', 'late', 'left_early'] as const;
const attendedStatusSet   = new Set<string>(attendedStatuses);

// // ─── Assign tier by rank position within the full sorted list ────────────────
// function assignTiersByRank(
//   scores: Array<{ clubId: string; totalScore: number }>,
// ): Map<string, string> {
//   const total = scores.length;
//   const tierMap = new Map<string, string>();

//   scores.forEach((entry, index) => {
//     // index 0 = highest score (already sorted desc before this is called)
//     const percentile = (index + 1) / total;   // fraction of clubs at or above this rank

//     let tier: string;
//     if      (percentile <= TIER_PERCENTILES.gold)   tier = 'gold';
//     else if (percentile <= TIER_PERCENTILES.silver)  tier = 'silver';
//     else if (percentile <= TIER_PERCENTILES.bronze)  tier = 'bronze';
//     else                                             tier = 'unranked';

//     // Edge case: if a club has 0 score it is always unranked regardless of rank
//     if (entry.totalScore === 0) tier = 'unranked';

//     tierMap.set(entry.clubId, tier);
//   });

//   return tierMap;
// }

// ─── REPLACE WITH THIS ────────────────────────────────────────────────────────

// Rank 1 = gold, rank 2 = silver, rank 3 = bronze, rest = unranked.
// This is absolute-position assignment: exactly one gold, one silver, one bronze
// (as long as ≥3 approved clubs with score > 0 exist).
// ✅ WITH THIS
function assignTiersByRank(
  scores: Array<{ clubId: string; totalScore: number }>,
): Map<string, string> {
  const tierMap = new Map<string, string>();

  scores.forEach((entry, index) => {
    let tier: string;

    // Zero-score clubs are always unranked regardless of position
    if (entry.totalScore === 0) {
      tier = 'unranked';
    } else if (index === 0) {
      tier = 'gold';    // Rank #1 → exactly one gold
    } else if (index === 1) {
      tier = 'silver';  // Rank #2 → exactly one silver
    } else if (index === 2) {
      tier = 'bronze';  // Rank #3 → exactly one bronze
    } else {
      tier = 'unranked';
    }

    tierMap.set(entry.clubId, tier);
  });

  return tierMap;
}

function formatClock(date: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(11, 16);
}

async function computeClubScore(clubId: string): Promise<{
  attendanceRate:    number;
  eventsHeld:        number;
  memberEngagement:  number;
  feedbackScore:     number;
  socialActivity:    number;
  totalScore:        number;
}> {
  const now           = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [club, recentEvents, totalMembers, activeAttendance] = await Promise.all([
    prisma.club.findUnique({
      where:  { id: clubId },
      select: {
        website_url:   true,
        instagram_url: true,
        linkedin_url:  true,
        twitter_url:   true,
        tags:          true,
        skill_areas:   true,
      },
    }),
    prisma.event.findMany({
      where: {
        club_id:      clubId,
        date:         { gte: thirtyDaysAgo, lte: now },
        is_published: true,
      },
      select: {
        id:                 true,
        capacity:           true,
        registration_count: true,
        is_featured:        true,
        skill_areas:        true,
        tags:               true,
        registrations: {
          select: { user_id: true, status: true },
        },
      },
    }),
    prisma.userClub.count({ where: { club_id: clubId } }),
    prisma.eventRegistration.findMany({
      where: {
        status: { in: [...attendedStatuses] },
        event:  { club_id: clubId, date: { gte: thirtyDaysAgo, lte: now } },
      },
      select:   { user_id: true },
      distinct: ['user_id'],
    }),
  ]);

  if (!club) throw new AppError('Club not found', 404, 'CLUB_NOT_FOUND');

  // ── Attendance rate (30%) ──────────────────────────────────────────────────
  const totalRegistrations = recentEvents.reduce(
    (sum, e) => sum + e.registrations.length, 0,
  );
  const totalPresent = recentEvents.reduce(
    (sum, e) => sum + e.registrations.filter((r) => attendedStatusSet.has(r.status)).length, 0,
  );
  const attendanceRateRaw =
    totalRegistrations > 0 ? (totalPresent / totalRegistrations) * 100 : 0;

  // ── Events held (25%) — rebalanced: 3 events = 60, 5 events = 100 ─────────
  // Old formula: length * 10 → needed 10 events for 100 (unrealistic in 30 days)
  // New formula: length * 20, capped at 100 → 5 events = full score
  const eventsHeldRaw = clamp100(recentEvents.length * 20);

  // ── Member engagement (20%) ────────────────────────────────────────────────
  const memberEngagementRaw =
    totalMembers > 0 ? (activeAttendance.length / totalMembers) * 100 : 0;

  // ── Feedback / fill rate (15%) — start at 0 when no events, not 50 ────────
  // Old formula: defaulted to 50 when no events, inflating scores for inactive clubs
  const avgFillRate =
    recentEvents.length > 0
      ? recentEvents.reduce(
          (sum, e) => sum + Math.min(1, e.registration_count / Math.max(1, e.capacity)),
          0,
        ) / recentEvents.length
      : 0;
  const feedbackScoreRaw = avgFillRate * 100;   // 0 when no events (was: 50)

  // ── Social activity (10%) — rebalanced ────────────────────────────────────
  const socialLinksCount = [
    club.website_url, club.instagram_url, club.linkedin_url, club.twitter_url,
  ].filter(Boolean).length;
  const contentSignals = club.tags.length + club.skill_areas.length;
  const featuredEvents = recentEvents.filter((e) => e.is_featured).length;

  // Old: socialLinks*20 could alone hit 80/100, drowning out activity signals
  // New: links contribute 15 each (max 60), content 3 each (max ~30), events 5 each
  const socialActivityRaw = clamp100(
    socialLinksCount * 15 +
    Math.min(30, contentSignals * 3) +
    featuredEvents * 10 +
    recentEvents.length * 5,
  );

  const totalScore =
    attendanceRateRaw   * WEIGHTS.attendanceRate   +
    eventsHeldRaw       * WEIGHTS.eventsHeld       +
    memberEngagementRaw * WEIGHTS.memberEngagement +
    feedbackScoreRaw    * WEIGHTS.feedbackScore    +
    socialActivityRaw   * WEIGHTS.socialActivity;

  return {
    attendanceRate:   round1(attendanceRateRaw),
    eventsHeld:       round1(eventsHeldRaw),
    memberEngagement: round1(memberEngagementRaw),
    feedbackScore:    round1(feedbackScoreRaw),
    socialActivity:   round1(socialActivityRaw),
    totalScore:       round1(totalScore),
  };
}

// ─── Nightly job ──────────────────────────────────────────────────────────────

export async function runNightlyRankingJob(): Promise<void> {
  const clubs = await prisma.club.findMany({
    where:  { status: 'approved' },
    select: { id: true },
  });

  const scores = await Promise.all(
    clubs.map(async (club) => ({
      clubId: club.id,
      ...(await computeClubScore(club.id)),
    })),
  );

  // Sort descending by score (ties broken by engagement then attendance)
  scores.sort((a, b) => {
    if (b.totalScore       !== a.totalScore)       return b.totalScore       - a.totalScore;
    if (b.memberEngagement !== a.memberEngagement) return b.memberEngagement - a.memberEngagement;
    return b.attendanceRate - a.attendanceRate;
  });

  // Assign tiers by rank position — guarantees gold clubs always exist
  const tierMap = assignTiersByRank(scores);

  await prisma.$transaction(
    scores.flatMap((score, index) => {
      const rank = index + 1;
      const tier = tierMap.get(score.clubId) ?? 'unranked';

      return [
        prisma.club_ranking_snapshots.create({
          data: {
            club_id:          score.clubId,
            ranking_score:    score.totalScore,
            rank,
            attendance_rate:  score.attendanceRate,
            events_held:      score.eventsHeld,
            member_engagement: score.memberEngagement,
            feedback_score:   score.feedbackScore,
            social_activity:  score.socialActivity,
            tier,
          },
        }),
        prisma.club.update({
          where: { id: score.clubId },
          data: {
            ranking_score: score.totalScore,
            ranking_tier:  tier,
            ranking_rank:  rank,
          },
        }),
      ];
    }),
  );
}

// ─── Breakdown for a single club ─────────────────────────────────────────────

export async function getRankingBreakdown(clubId: string) {
  const club = await prisma.club.findUnique({
    where:  { id: clubId },
    select: {
      ranking_rank:  true,
      ranking_score: true,
      ranking_tier:  true,
      updated_at:    true,
    },
  });

  if (!club) throw new AppError('Club not found', 404, 'CLUB_NOT_FOUND');

  const [scores, snapshots] = await Promise.all([
    computeClubScore(clubId),
    prisma.club_ranking_snapshots.findMany({
      where:   { club_id: clubId },
      orderBy: { computed_at: 'desc' },
      take:    2,
      select:  { rank: true, computed_at: true },
    }),
  ]);

  const previousSnapshot = snapshots[1];

  return {
    ...scores,
    tier:         club.ranking_tier,
    rank:         club.ranking_rank ?? 0,
    previousRank: previousSnapshot?.rank,
    updatedAt:    (snapshots[0]?.computed_at ?? club.updated_at).toISOString(),
  };
}

// ─── Ranking history for a single club ────────────────────────────────────────

export async function getRankingHistory(clubId: string) {
  const club = await prisma.club.findUnique({
    where:  { id: clubId },
    select: { id: true },
  });

  if (!club) throw new AppError('Club not found', 404, 'CLUB_NOT_FOUND');

  const snapshots = await prisma.club_ranking_snapshots.findMany({
    where:   { club_id: clubId },
    orderBy: { computed_at: 'asc' },
    take:    30,
    select:  { ranking_score: true, rank: true, computed_at: true },
  });

  return snapshots.map((s) => ({
    date:  s.computed_at.toISOString().slice(0, 10),
    score: s.ranking_score,
    rank:  s.rank,
  }));
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(params: {
  page?:  number;
  limit?: number;
  tier?:  string;
}) {
  const page  = params.page  ?? 1;
  const limit = params.limit ?? 50;
  const skip  = (page - 1) * limit;

  const where = {
    status: 'approved' as const,
    ...(params.tier ? { ranking_tier: params.tier } : {}),
  };

  const [clubs, total] = await Promise.all([
    prisma.club.findMany({
      where,
      orderBy: [
        { ranking_rank:  'asc' },
        { ranking_score: 'desc' },
        { member_count:  'desc' },
      ],
      skip,
      take: limit,
      select: {
        id:            true,
        name:          true,
        slug:          true,
        category:      true,
        logo_url:      true,
        member_count:  true,
        ranking_score: true,
        ranking_tier:  true,
        ranking_rank:  true,
      },
    }),
    prisma.club.count({ where }),
  ]);

  const previousSnapshots = await prisma.club_ranking_snapshots.findMany({
    where:   { club_id: { in: clubs.map((c) => c.id) } },
    orderBy: [{ club_id: 'asc' }, { computed_at: 'desc' }],
    select:  { club_id: true, rank: true },
  });

  const previousRankMap = new Map<string, number | undefined>();
  const seenCounts      = new Map<string, number>();
  for (const snapshot of previousSnapshots) {
    const count = (seenCounts.get(snapshot.club_id) ?? 0) + 1;
    seenCounts.set(snapshot.club_id, count);
    if (count === 2) previousRankMap.set(snapshot.club_id, snapshot.rank);
  }

  return {
    data: clubs.map((club) => ({
      id:           club.id,
      name:         club.name,
      slug:         club.slug,
      category:     club.category,
      logoUrl:      club.logo_url ?? undefined,
      memberCount:  club.member_count,
      rankingScore: club.ranking_score,
      tier:         club.ranking_tier as string,
      rank:         club.ranking_rank ?? 0,
      previousRank: previousRankMap.get(club.id),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Featured events (unchanged) ─────────────────────────────────────────────

export async function getFeaturedEvents(limit = 6) {
  const now            = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      is_published: true,
      date:         { gte: now, lte: thirtyDaysLater },
    },
    select: {
      id:                 true,
      club_id:            true,
      title:              true,
      date:               true,
      end_date:           true,
      venue:              true,
      capacity:           true,
      registration_count: true,
      event_type:         true,
      tags:               true,
      skill_areas:        true,
      is_featured:        true,
      points_reward:      true,
      volunteer_hours:    true,
      banner_url:         true,
      created_at:         true,
      club: { select: { name: true, logo_url: true } },
    },
    take: Math.max(limit * 4, 12),
  });

  const scored = events.map((event) => {
    const fillRate       = event.capacity > 0 ? event.registration_count / event.capacity : 0;
    const hoursUntil     = (event.date.getTime() - now.getTime()) / (1000 * 60 * 60);
    const recencyBoost   = Math.max(0, 1 - hoursUntil / (30 * 24));
    const tagBoost       = Math.min(0.1, event.tags.length * 0.02 + event.skill_areas.length * 0.02);
    const featuredBoost  = event.is_featured ? 0.15 : 0;
    const engagementScore = (fillRate + recencyBoost + tagBoost + featuredBoost) * 100;
    return { ...event, engagementScore };
  });

  scored.sort((a, b) => b.engagementScore - a.engagementScore);

  return scored.slice(0, limit).map((event) => ({
    id:                event.id,
    title:             event.title,
    clubId:            event.club_id,
    club:              { name: event.club.name, logoUrl: event.club.logo_url ?? undefined },
    date:              event.date.toISOString(),
    startTime:         formatClock(event.date),
    endTime:           formatClock(event.end_date ?? event.date),
    venue:             event.venue,
    capacity:          event.capacity,
    registrationCount: event.registration_count,
    eventType:         event.event_type,
    tags:              event.tags,
    skillAreas:        event.skill_areas,
    pointsReward:      event.points_reward,
    volunteerHours:    event.volunteer_hours,
    heroImageUrl:      event.banner_url ?? undefined,
    engagementScore:   round1(event.engagementScore),
    isFeatured:        true as const,
    createdAt:         event.created_at.toISOString(),
  }));
}