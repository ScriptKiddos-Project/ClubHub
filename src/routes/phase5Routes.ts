import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import {
  getRecommendations,
  refreshRecommendations,
  getClubAnalytics,
  getEngagementScores,
  getCampusTrendsHandler,
  getLinkedInShareUrl,
  getAchievementShareUrl,
} from '../controllers/phase5Controller';

const router = Router();

// ─── AI Recommendations (authenticated users) ─────────────────────────────────
// GET /api/v1/recommendations
router.get('/recommendations', authenticate, getRecommendations);

// POST /api/v1/recommendations/refresh
router.post('/recommendations/refresh', authenticate, refreshRecommendations);

// ─── Club Analytics (club_admin / secretary / super_admin) ────────────────────
// GET /api/v1/clubs/:clubId/analytics
router.get(
  '/clubs/:clubId/analytics',
  authenticate,
  rbac('club_admin', 'secretary', 'super_admin'),
  getClubAnalytics
);

// GET /api/v1/clubs/:clubId/engagement
router.get(
  '/clubs/:clubId/engagement',
  authenticate,
  rbac('club_admin', 'secretary', 'super_admin'),
  getEngagementScores
);

// ─── Campus Trends (public, authenticated) ────────────────────────────────────
// GET /api/v1/trends
router.get('/trends', authenticate, getCampusTrendsHandler);

// ─── LinkedIn Share ───────────────────────────────────────────────────────────
// GET /api/v1/share/linkedin/certificate/:certificateId
router.get(
  '/share/linkedin/certificate/:certificateId',
  authenticate,
  getLinkedInShareUrl
);

// GET /api/v1/share/linkedin/achievement/:type
router.get(
  '/share/linkedin/achievement/:type',
  authenticate,
  getAchievementShareUrl
);

export default router;