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

const router = Router();

// Health check
router.use('/api/health', healthRouter);

// Auth
router.use('/api/v1/auth', authRouter);

// Users
router.use('/api/v1/users', userRouter);

// Clubs
router.use('/api/v1/clubs', clubRouter);

// Events
router.use('/api/v1/events', eventRouter);

// Attendance
router.use('/api/v1/events', attendanceRouter);

// Notifications
router.use('/api/v1/notifications', notificationRouter);

// Admin
router.use('/api/v1/admin', adminRouter);

// Admin — communities
router.use('/api/v1/admin/communities', communityRouter);

// Phase 2
router.use('/api/v1', rankingRouter);
router.use('/api/v1', suggestionRouter);

export default router;
