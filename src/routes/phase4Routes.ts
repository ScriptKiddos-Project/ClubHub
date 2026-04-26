import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as chatController from '../controllers/chatController';
import * as recruitmentController from '../controllers/recruitmentController';
import * as notifService from '../services/notificationServiceV2';

const router = Router();

// ─── Chat Routes ──────────────────────────────────────────────────────────────

// GET /api/v1/clubs/:clubId/messages
router.get('/clubs/:clubId/messages', authenticate, chatController.getClubMessages);

// GET /api/v1/events/:eventId/messages
router.get('/events/:eventId/messages', authenticate, chatController.getEventMessages);

// POST /api/v1/clubs/:clubId/announcements
router.post(
  '/clubs/:clubId/announcements',
  authenticate,
  rbac(['secretary', 'event_manager', 'super_admin']),
  validate(z.object({ body: z.object({ title: z.string().min(1), body: z.string().min(1) }) })),
  chatController.postAnnouncement
);

// GET /api/v1/clubs/:clubId/announcements
router.get('/clubs/:clubId/announcements', authenticate, chatController.getAnnouncements);

// ─── Recruitment Routes ───────────────────────────────────────────────────────

// POST /api/v1/clubs/:clubId/applications
router.post(
  '/clubs/:clubId/applications',
  authenticate,
  rbac(['student', 'member']),
  validate(z.object({ body: z.object({ formData: z.record(z.unknown()) }) })),
  recruitmentController.applyToClub
);

// GET /api/v1/clubs/:clubId/applications
router.get(
  '/clubs/:clubId/applications',
  authenticate,
  rbac(['secretary', 'event_manager', 'super_admin']),
  recruitmentController.listApplications
);

// PATCH /api/v1/clubs/:clubId/applications/:applicationId
router.patch(
  '/clubs/:clubId/applications/:applicationId',
  authenticate,
  rbac(['secretary', 'event_manager', 'super_admin']),
  validate(z.object({ body: z.object({ status: z.enum(['shortlisted', 'rejected']) }) })),
  recruitmentController.patchApplicationStatus
);

// POST /api/v1/clubs/:clubId/interviews
router.post(
  '/clubs/:clubId/interviews',
  authenticate,
  rbac(['secretary', 'event_manager', 'super_admin']),
  validate(
    z.object({
      body: z.object({
        applicationId: z.string().uuid(),
        candidateId: z.string().uuid(),
        slotTime: z.string().datetime(),
      }),
    })
  ),
  recruitmentController.scheduleInterview
);

// PATCH /api/v1/interviews/:interviewId/result
router.patch(
  '/interviews/:interviewId/result',
  authenticate,
  rbac(['secretary', 'event_manager', 'super_admin']),
  validate(z.object({ body: z.object({ result: z.enum(['accepted', 'rejected']) }) })),
  recruitmentController.patchInterviewResult
);

// ─── Notification Preferences ─────────────────────────────────────────────────

// GET /api/v1/notifications (override existing — now uses notifService)
router.get('/notifications/preferences', authenticate, async (req: any, res: Response, next: NextFunction) => {
  try {
    const prefs = await notifService.getUserPreferences(req.user.userId); // userId from JwtPayload
    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/notifications/preferences',
  authenticate,
  validate(
    z.object({
      body: z.object({
        emailEnabled: z.boolean(),
        pushEnabled: z.boolean(),
        types: z.array(z.string()),
      }),
    })
  ),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const prefs = await notifService.updateUserPreferences(req.user.userId, req.body);
      res.json({ success: true, data: prefs });
    } catch (err) {
      next(err);
    }
  }
);

export default router;