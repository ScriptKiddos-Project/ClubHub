import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';
import { AppError } from '../utils/AppError';

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
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'NOTIFICATIONS_ERROR', message: error.message },
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
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'MARK_READ_ERROR', message: error.message },
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
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'MARK_ALL_READ_ERROR', message: error.message },
    });
  }
}

// ── DELETE /api/v1/notifications/:id ─────────────────────────────────────────
export async function deleteNotification(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await notificationService.deleteNotificationById(id, userId);

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'DELETE_NOTIFICATION_ERROR', message: error.message },
    });
  }
}