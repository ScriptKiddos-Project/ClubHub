import prisma from '../config/database';
import { emailQueue, EmailJobType } from '../config/queues'; // matches existing pattern
import { emitNotification } from '../config/socket';
import { NotificationType } from '@prisma/client';

type Priority = 'critical' | 'standard' | 'low';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: NotificationType; // must use the existing enum from schema
  priority: Priority;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  emailJobType?: EmailJobType; // use existing EmailJobType enum
  emailJobData?: Record<string, unknown>;
}

export const sendNotification = async (payload: NotificationPayload) => {
  // Check user preferences before sending
  const prefs = await prisma.notificationPreference.findUnique({
    where: { user_id: payload.userId },
  });

  // Persist in-app notification — always
  const notification = await prisma.notification.create({
    data: {
      user_id: payload.userId,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      metadata: payload.metadata ?? {},
    },
  });

  const pushEnabled = prefs?.push_enabled ?? true;
  const emailEnabled = prefs?.email_enabled ?? true;

  if (payload.priority === 'critical') {
    // Immediate socket push
    if (pushEnabled) {
      emitNotification(payload.userId, notification);
    }
    // Immediate email
    if (payload.sendEmail && emailEnabled && payload.emailJobType && payload.emailJobData) {
      await emailQueue.add(payload.emailJobType, payload.emailJobData, { priority: 1 });
    }
  } else if (payload.priority === 'standard') {
    if (pushEnabled) {
      emitNotification(payload.userId, notification);
    }
    if (payload.sendEmail && emailEnabled && payload.emailJobType && payload.emailJobData) {
      await emailQueue.add(payload.emailJobType, payload.emailJobData, { priority: 2 });
    }
  }
  // low priority: socket only, no email — batched digest handled separately

  return notification;
};

export const sendBulkNotification = async (
  userIds: string[],
  payload: Omit<NotificationPayload, 'userId'>
) => {
  await Promise.all(userIds.map((userId) => sendNotification({ ...payload, userId })));
};

export const getUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
};

export const markRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { is_read: true },
  });
};

export const getUserPreferences = async (userId: string) => {
  return prisma.notificationPreference.findUnique({
    where: { user_id: userId },
  });
};

export const updateUserPreferences = async (
  userId: string,
  prefs: { emailEnabled: boolean; pushEnabled: boolean; types: string[] }
) => {
  return prisma.notificationPreference.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      email_enabled: prefs.emailEnabled,
      push_enabled: prefs.pushEnabled,
      types: prefs.types,
    },
    update: {
      email_enabled: prefs.emailEnabled,
      push_enabled: prefs.pushEnabled,
      types: prefs.types,
    },
  });
};