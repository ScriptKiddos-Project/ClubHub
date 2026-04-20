import { notificationQueue, NotificationJobType } from '../config/queues';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../types';

notificationQueue.process(NotificationJobType.IN_APP, async (job) => {
  const { userId, title, body, type } = job.data;

  console.log(`[NotificationWorker] Creating in-app notification for user ${userId}: "${title}"`);

  await createNotification({
    userId,
    title,
    body,
    type: type as NotificationType,
  });

  console.log(`[NotificationWorker] ✅ Notification created for user ${userId}`);
});

notificationQueue.on('completed', (job) => {
  console.log(`[NotificationWorker] Job ${job.id} (${job.name}) completed`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`[NotificationWorker] Job ${job.id} (${job.name}) FAILED:`, err.message);
});

console.log('[NotificationWorker] Worker started — listening for notification jobs');
