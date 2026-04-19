import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

// ── GET /api/v1/notifications ─────────────────────────────────────────────────
export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const result = await notificationService.getUserNotifications(userId, page, limit);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(err.status ?? 500).json({
      success: false,
      error: { code: 'NOTIFICATIONS_ERROR', message: err.message },
    });
  }
}

// ── PUT /api/v1/notifications/:id/read ───────────────────────────────────────
export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await notificationService.markNotificationRead(id, userId);

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err: any) {
    return res.status(err.status ?? 500).json({
      success: false,
      error: { code: 'MARK_READ_ERROR', message: err.message },
    });
  }
}

// ── PUT /api/v1/notifications/read-all ───────────────────────────────────────
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const result = await notificationService.markAllNotificationsRead(userId);

    return res.status(200).json({
      success: true,
      message: `${result.count} notifications marked as read`,
      data: result,
    });
  } catch (err: any) {
    return res.status(err.status ?? 500).json({
      success: false,
      error: { code: 'MARK_ALL_READ_ERROR', message: err.message },
    });
  }
}

// ── DELETE /api/v1/notifications/:id ─────────────────────────────────────────
export async function deleteNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await notificationService.deleteNotification(id, userId);

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (err: any) {
    return res.status(err.status ?? 500).json({
      success: false,
      error: { code: 'DELETE_NOTIFICATION_ERROR', message: err.message },
    });
  }
}
