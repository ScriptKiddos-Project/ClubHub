import Bull from 'bull';

const redisUrl = process.env.REDIS_URL!;

// ── Email Queue ──────────────────────────────────────────────────────────────
export const emailQueue = new Bull('email', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// ── Notification Queue ───────────────────────────────────────────────────────
export const notificationQueue = new Bull('notification', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// ── Event Reminder Queue ─────────────────────────────────────────────────────
export const reminderQueue = new Bull('reminder', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

// ── Job Type Enums ───────────────────────────────────────────────────────────
export enum EmailJobType {
  REGISTRATION_CONFIRMATION = 'registration_confirmation',
  EVENT_REMINDER = 'event_reminder',
  WELCOME_EMAIL = 'welcome_email',
  EVENT_CANCELLATION = 'event_cancellation',
}

export enum NotificationJobType {
  IN_APP = 'in_app',
  PUSH = 'push',
}

// ── Payload Interfaces ───────────────────────────────────────────────────────
export interface RegistrationConfirmationPayload {
  userId: string;
  userEmail: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  eventVenue: string;
  clubName: string;
}

export interface EventReminderPayload {
  userId: string;
  userEmail: string;
  userName: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  eventVenue: string;
  clubName: string;
}

export interface InAppNotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
}

export interface CancellationEmailPayload {
  userId: string;
  userEmail: string;
  userName: string;
  eventTitle: string;
  reason?: string;
}

emailQueue.on('failed', (job, err) => {
  console.error(`[EmailQueue] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`[NotificationQueue] Job ${job.id} failed:`, err.message);
});

reminderQueue.on('failed', (job, err) => {
  console.error(`[ReminderQueue] Job ${job.id} failed:`, err.message);
});

console.log('[Queues] Email, Notification, and Reminder queues initialized');
