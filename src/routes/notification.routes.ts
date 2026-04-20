import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationRateLimiter } from '../middleware/rateLimiter';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(authenticate);
router.use(notificationRateLimiter);

// GET /api/v1/notifications?page=1&limit=20
router.get('/', getNotifications);

// PUT /api/v1/notifications/read-all  (must be before /:id/read)
router.put('/read-all', markAllAsRead);

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', markAsRead);

// DELETE /api/v1/notifications/:id
router.delete('/:id', deleteNotification);

export default router;