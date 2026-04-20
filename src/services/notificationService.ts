// server/src/services/notificationService.ts
import prisma from "../config/database";
import { NotificationType } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreateNotificationOptions {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
}

// ── Single notification create (fire-and-forget from other services) ──────────

export async function createNotification(
  options: CreateNotificationOptions
): Promise<void> {
  await prisma.notification.create({
    data: {
      user_id:  options.userId,
      title:    options.title,
      body:     options.body,
      type:     options.type,
      metadata: (options.metadata ?? {}) as import("@prisma/client").Prisma.InputJsonValue,
    },
  });
}

// ── Bulk create (event reminders, club announcements) ─────────────────────────
// Called by Bull Queue worker in Phase 1C when sending 24hr reminders to
// all registrants of an event.

export async function createBulkNotifications(options: {
  userIds: string[];
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
}): Promise<{ count: number }> {
  const result = await prisma.notification.createMany({
    data: options.userIds.map((userId) => ({
      user_id:  userId,
      title:    options.title,
      body:     options.body,
      type:     options.type,
      metadata: (options.metadata ?? {}) as import("@prisma/client").Prisma.InputJsonValue,
    })),
  });

  return { count: result.count };
}

// ── GET /api/v1/notifications — paginated list for current user ───────────────

export async function getUserNotifications(
  userId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where:   { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { user_id: userId } }),
    prisma.notification.count({ where: { user_id: userId, is_read: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// ── PUT /api/v1/notifications/:id/read — mark single notification read ────────
// Ownership check here in service layer, not controller — keeps controller thin.

export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { user_id: true },  // select only what we need for the ownership check
  });

  if (!notification) {
    const err = new Error("Notification not found") as any;
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (notification.user_id !== userId) {
    const err = new Error("Access denied") as any;
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data:  { is_read: true },
  });
}

// ── PUT /api/v1/notifications/read-all — mark all read for user ───────────────

export async function markAllNotificationsRead(
  userId: string
): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data:  { is_read: true },
  });

  return { count: result.count };
}
// ── DELETE /api/v1/notifications/:id ─────────────────────────────────────────

export async function deleteNotificationById(
  notificationId: string,
  userId: string
): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { user_id: true },
  });

  if (!notification) {
    const err = new Error("Notification not found") as any;
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  if (notification.user_id !== userId) {
    const err = new Error("Access denied") as any;
    err.statusCode = 403;
    err.code = "FORBIDDEN";
    throw err;
  }

  await prisma.notification.delete({ where: { id: notificationId } });
}