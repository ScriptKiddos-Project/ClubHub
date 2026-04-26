// src/routes/phase3Routes.ts
// Phase 3 — Geo-fence attendance + Profile / Achievements / Resume routes

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { generalRateLimiter } from '../middleware/rateLimiter';
import { markGeoAttendance } from '../controllers/geoAttendanceController';
import {
  getAchievements,
  getPointsHistory,
  downloadResume,
  getCertificates,
  downloadCertificate,
} from '../controllers/profileController';

// ── Geo Attendance Router (mounted at /api/v1/events) ─────────────────────────

export const geoAttendanceRouter = Router();

geoAttendanceRouter.use(authenticate);

/**
 * POST /api/v1/events/:id/geo-attendance
 * Body: { lat: number, lon: number }
 * Student submits their GPS coordinates; server validates geo-fence.
 */
geoAttendanceRouter.post(
  '/:id/geo-attendance',
  rbac('student', 'member', 'secretary', 'event_manager'),
  generalRateLimiter,
  markGeoAttendance
);

// ── Profile Router (mounted at /api/v1/users) ─────────────────────────────────

export const profileRouter = Router();

profileRouter.use(authenticate);

/**
 * GET /api/v1/users/me/achievements
 * Full profile: clubs, events attended, badges, certificates, summary stats
 */
profileRouter.get(
  '/me/achievements',
  rbac('student', 'member', 'secretary', 'event_manager', 'club_admin', 'super_admin'),
  getAchievements
);

/**
 * GET /api/v1/users/me/points-history?page=1&limit=20
 * Paginated AICTE points ledger with multiplier details
 */
profileRouter.get(
  '/me/points-history',
  rbac('student', 'member', 'secretary', 'event_manager', 'club_admin', 'super_admin'),
  getPointsHistory
);

/**
 * GET /api/v1/users/me/resume
 * Streams a full-profile resume PDF for download
 */
profileRouter.get(
  '/me/resume',
  rbac('student', 'member', 'secretary', 'event_manager', 'club_admin', 'super_admin'),
  downloadResume
);

/**
 * GET /api/v1/users/me/certificates
 * List all certificates issued to the current user
 */
profileRouter.get(
  '/me/certificates',
  rbac('student', 'member', 'secretary', 'event_manager', 'club_admin', 'super_admin'),
  getCertificates
);

/**
 * GET /api/v1/users/me/certificates/:certId/download
 * Download a specific certificate as PDF
 */
profileRouter.get(
  '/me/certificates/:certId/download',
  rbac('student', 'member', 'secretary', 'event_manager', 'club_admin', 'super_admin'),
  downloadCertificate
);
