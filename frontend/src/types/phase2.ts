// ─── PHASE 2 TYPES — Club & Event Advanced Features ──────────────────────────

// ─── RANKING ─────────────────────────────────────────────────────────────────

export type RankingTier = 'gold' | 'silver' | 'bronze' | 'unranked';

export interface RankingBreakdown {
  attendanceRate: number;        // 30% weight
  eventsHeld: number;            // 25% weight
  memberEngagement: number;      // 20% weight
  feedbackScore: number;         // 15% weight
  socialActivity: number;        // 10% weight
  totalScore: number;            // 0–100
  tier: RankingTier;
  rank: number;
  previousRank?: number;
  updatedAt: string;
}

export interface ClubRankingHistory {
  date: string;
  score: number;
  rank: number;
}

export interface RankedClub {
  id: string;
  name: string;
  slug: string;
  category: string;
  logoUrl?: string;
  memberCount: number;
  rankingScore: number;
  tier: RankingTier;
  rank: number;
  previousRank?: number;
}

// ─── SUGGESTIONS ─────────────────────────────────────────────────────────────

export type SuggestionStatus = 'pending' | 'under_consideration' | 'planned' | 'rejected';

export interface Suggestion {
  id: string;
  clubId: string;
  userId: string;
  user?: { name: string; avatarUrl?: string };
  title: string;
  body: string;
  status: SuggestionStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSuggestionPayload {
  clubId: string;
  title: string;
  body: string;
}

// ─── ADVANCED EVENT FILTERING ─────────────────────────────────────────────────

export interface EventFilters {
  clubId?: string;
  eventType?: string;
  tags?: string[];
  skillAreas?: string[];
  volunteerHoursMin?: number;
  dateFrom?: string;
  dateTo?: string;
  isFeatured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FeaturedEvent {
  id: string;
  title: string;
  clubId: string;
  club?: { name: string; logoUrl?: string };
  date: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  capacity: number;
  registrationCount: number;
  eventType: string;
  tags: string[];
  skillAreas: string[];
  pointsReward: number;
  volunteerHours: number;
  heroImageUrl?: string;
  engagementScore: number; // (registrations / capacity) ratio + recency
  isFeatured: true;
  createdAt: string;
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  eventType: string;
  club?: { name: string; logoUrl?: string };
  isRegistered?: boolean;
  registrationCount: number;
  capacity: number;
}
