import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { RankedClub, RankingBreakdown, ClubRankingHistory } from '../types/phase2';

export const rankingService = {
  /** GET /api/v1/clubs/rankings — leaderboard list */
  getLeaderboard: (params?: { page?: number; limit?: number; tier?: string }) =>
    api.get<PaginatedResponse<RankedClub>>('/clubs/rankings', { params }),

  /** GET /api/v1/clubs/:id/ranking — detailed score breakdown */
  getBreakdown: (clubId: string) =>
    api.get<ApiResponse<RankingBreakdown>>(`/clubs/${clubId}/ranking`),

  /** GET /api/v1/clubs/:id/ranking/history — historical scores */
  getHistory: (clubId: string) =>
    api.get<ApiResponse<ClubRankingHistory[]>>(`/clubs/${clubId}/ranking/history`),
};
