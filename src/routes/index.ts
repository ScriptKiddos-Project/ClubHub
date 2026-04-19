// src/routes/index.ts
import { Router } from 'express';
import authRouter, { communityRouter } from './auth.routes';
import healthRouter from './health.routes';

const router = Router();

// Health check
router.use('/health', healthRouter);

// Auth
router.use('/api/v1/auth', authRouter);

// Admin — communities (access code management)
router.use('/api/v1/admin/communities', communityRouter);

export default router;
