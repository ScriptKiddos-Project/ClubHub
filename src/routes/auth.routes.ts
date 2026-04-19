// src/routes/auth.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { authRateLimiter, coreJoinRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    department: z.string().max(100).optional(),
    enrollment_year: z.number().int().min(2000).max(2100).optional(),
    degree_type: z.enum(['bachelors', 'masters', 'phd', 'diploma']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/),
  }),
});

const coreJoinSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    club_id: z.string().uuid(),
    access_code: z.string().min(5),
  }),
});

const verifyEmailQuerySchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

const createCommunitySchema = z.object({
  body: z.object({
    club_id: z.string().uuid(),
    name: z.string().min(2).max(200),
    tenure_start: z.string().datetime(),
    tenure_end: z.string().datetime(),
  }),
});

const generateCodeSchema = z.object({
  body: z.object({
    assigned_role: z.enum(['member', 'secretary', 'event_manager', 'club_admin']),
    max_uses: z.number().int().positive().optional(),
  }),
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.get('/verify-email', validate(verifyEmailQuerySchema), authController.verifyEmail);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post('/core-join', coreJoinRateLimiter, validate(coreJoinSchema), authController.coreJoin);

export default router;

// ── Admin Community Routes (exported for admin router) ────────────────────────
export const communityRouter = Router();

communityRouter.post(
  '/',
  authenticate,
  rbac('super_admin'),
  validate(createCommunitySchema),
  authController.createCommunity
);

communityRouter.post(
  '/:id/generate-code',
  authenticate,
  rbac('super_admin'),
  validate(generateCodeSchema),
  authController.generateCode
);

communityRouter.put(
  '/:id/revoke-code',
  authenticate,
  rbac('super_admin'),
  authController.revokeCode
);

communityRouter.get(
  '/:id/code-usage',
  authenticate,
  rbac('super_admin'),
  authController.getCodeUsage
);