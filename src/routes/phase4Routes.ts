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

router.get('/clubs/:clubId/messages', authenticate, chatController.getClubMessages);
router.get('/events/:eventId/messages', authenticate, chatController.getEventMessages);

router.post(
  '/clubs/:clubId/announcements',
  authenticate,
  rbac('secretary', 'event_manager', 'super_admin'),
  validate(z.object({ body: z.object({ title: z.string().min(1), body: z.string().min(1) }) })),
  chatController.postAnnouncement
);

router.get('/clubs/:clubId/announcements', authenticate, chatController.getAnnouncements);

// ─── Recruitment Routes ───────────────────────────────────────────────────────

router.post(
  '/clubs/:clubId/applications',
  authenticate,
  rbac('student', 'member'),
  validate(z.object({ body: z.object({ formData: z.record(z.unknown()) }) })),
  recruitmentController.applyToClub
);

router.get(
  '/clubs/:clubId/applications',
  authenticate,
  rbac('secretary', 'event_manager', 'super_admin'),
  recruitmentController.listApplications
);

router.patch(
  '/clubs/:clubId/applications/:applicationId',
  authenticate,
  rbac('secretary', 'event_manager', 'super_admin'),
  validate(z.object({ body: z.object({ status: z.enum(['shortlisted', 'rejected']) }) })),
  recruitmentController.patchApplicationStatus
);

router.post(
  '/clubs/:clubId/interviews',
  authenticate,
  rbac('secretary', 'event_manager', 'super_admin'),
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

router.patch(
  '/interviews/:interviewId/result',
  authenticate,
  rbac('secretary', 'event_manager', 'super_admin'),
  validate(z.object({ body: z.object({ result: z.enum(['accepted', 'rejected']) }) })),
  recruitmentController.patchInterviewResult
);

// ─── Notification Preferences ─────────────────────────────────────────────────

router.get('/notifications/preferences', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefs = await notifService.getUserPreferences(req.user!.id);
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prefs = await notifService.updateUserPreferences(req.user!.id, req.body);
      res.json({ success: true, data: prefs });
    } catch (err) {
      next(err);
    }
  }
);

export default router;