// src/routes/index.ts  ──  Updated for Phase 3
// Replace your existing src/routes/index.ts with this file.

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
import { geoAttendanceRouter, profileRouter } from './phase3Routes';   // ← Phase 3
import phase5Router from './phase5Routes';
import '../jobs/phase5Jobs'; // Register cron jobs
const router = Router();

// Health check
router.use('/api/health', healthRouter);

// Auth
router.use('/api/v1/auth', authRouter);

// Users
router.use('/api/v1/users', userRouter);

// Phase 3 — Profile / achievements / resume / certificates
router.use('/api/v1/users', profileRouter);

// Clubs
router.use('/api/v1/clubs', clubRouter);

// Events
router.use('/api/v1/events', eventRouter);

// Attendance (Phase 1C — QR, PIN, manual, bulk)
router.use('/api/v1/events', attendanceRouter);

// Phase 3 — Geo-fence attendance
router.use('/api/v1/events', geoAttendanceRouter);

// Notifications
router.use('/api/v1/notifications', notificationRouter);

// Admin
router.use('/api/v1/admin', adminRouter);

// Admin — communities
router.use('/api/v1/admin/communities', communityRouter);

// Phase 2 — Rankings & Suggestions
router.use('/api/v1', rankingRouter);
router.use('/api/v1', suggestionRouter);

router.use('/api/v1', phase5Router);

export default router;
