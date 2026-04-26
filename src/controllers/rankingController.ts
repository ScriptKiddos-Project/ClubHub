import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  getFeaturedEvents,
  getLeaderboard,
  getRankingBreakdown,
  getRankingHistory,
} from '../services/rankingService';

// GET /api/v1/clubs/rankings
export const listLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const tier = (req.query.tier as string) || undefined;

  const result = await getLeaderboard({ page, limit, tier });

  res.status(200).json({
    success: true,
    ...result,
  });
});

// GET /api/v1/clubs/:id/ranking
export const getClubRanking = asyncHandler(async (req: Request, res: Response) => {
  const breakdown = await getRankingBreakdown(req.params.id);
  res.status(200).json({ success: true, data: breakdown });
});

// GET /api/v1/clubs/:id/ranking/history
export const getClubRankingHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await getRankingHistory(req.params.id);
  res.status(200).json({ success: true, data: history });
});

// GET /api/v1/events/featured
export const listFeaturedEvents = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 6;
  const events = await getFeaturedEvents(limit);
  res.status(200).json({ success: true, data: events });
});
