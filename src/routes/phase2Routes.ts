import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listLeaderboard,
  getClubRanking,
  getClubRankingHistory,
  listFeaturedEvents,
} from '../controllers/rankingController';
import {
  submitSuggestion,
  getSuggestions,
  patchSuggestionStatus,
} from '../controllers/suggestionController';

// ─── Ranking routes (mount on /api/v1) ───────────────────────────────────────
export const rankingRouter = Router();

// Public – no auth needed for leaderboard
rankingRouter.get('/clubs/rankings',               listLeaderboard);
rankingRouter.get('/clubs/:id/ranking',            getClubRanking);
rankingRouter.get('/clubs/:id/ranking/history',    getClubRankingHistory);
rankingRouter.get('/events/featured',              listFeaturedEvents);

// ─── Suggestion routes (mount on /api/v1) ────────────────────────────────────
export const suggestionRouter = Router();

suggestionRouter.post(
  '/clubs/:id/suggestions',
  authenticate,
  submitSuggestion,
);

suggestionRouter.get(
  '/clubs/:id/suggestions',
  authenticate,
  getSuggestions,
);

suggestionRouter.patch(
  '/clubs/:id/suggestions/:suggestionId',
  authenticate,
  patchSuggestionStatus,
);
