// src/routes/index.ts
import { Router } from 'express';
import authRouter, { communityRouter } from './auth.routes';
import healthRouter from './health.routes';
import userRouter from './user.routes';
import clubRouter from './club.routes';
import eventRouter from './event.routes';
import attendanceRouter from './attendance.routes';
import notificationRouter from './notification.routes';
import adminRouter from './admin.routes';
import { rankingRouter, suggestionRouter } from './phase2Routes';
import { geoAttendanceRouter, profileRouter } from './phase3Routes';
import phase5Router from './phase5Routes';
import phase4Router from './phase4Routes';
import '../jobs/phase5Jobs';

const router = Router();

// Health check
router.use('/api/health', healthRouter);

// Auth
router.use('/api/v1/auth', authRouter);

// Users
router.use('/api/v1/users', userRouter);
router.use('/api/v1/users', profileRouter);

// Phase 2 — Rankings & Suggestions
router.use('/api/v1', rankingRouter);
router.use('/api/v1', suggestionRouter);

// ✅ Phase 4 mounted BEFORE clubRouter to prevent /:id swallowing /clubs/:clubId/interviews
router.use('/api/v1', phase4Router);

// ✅ Keep your messaging fix — but mount under /api/v1/users NOT /api/v1/clubs
// This won't conflict because phase4's club routes are already handled above
router.use('/api/v1/users', phase4Router);

// Clubs — generic /:id routes come AFTER specific phase4 club routes
router.use('/api/v1/clubs', clubRouter);

// Events
router.use('/api/v1/events', eventRouter);
router.use('/api/v1/events', attendanceRouter);
router.use('/api/v1/events', geoAttendanceRouter);

// Notifications
router.use('/api/v1/notifications', notificationRouter);

// Admin
router.use('/api/v1/admin', adminRouter);
router.use('/api/v1/admin/communities', communityRouter);

// Phase 5
router.use('/api/v1', phase5Router);

export default router; // ← this was missing, causing the TS1192 error