import { PrismaClient } from '@prisma/client';
import { reminderQueue, emailQueue, notificationQueue, EmailJobType, NotificationJobType } from '../config/queues';
import { NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

// ── Schedule reminders for newly created events ───────────────────────────────
export async function scheduleEventReminder(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { club: true },
  });

  if (!event) return;

  const reminderTime = new Date(event.date.getTime() - 24 * 60 * 60 * 1000);
  const delay = reminderTime.getTime() - Date.now();

  if (delay <= 0) {
    console.log(`[ReminderWorker] Event ${eventId} is less than 24h away — skipping reminder scheduling`);
    return;
  }

  await reminderQueue.add(
    'send_event_reminders',
    { eventId, clubName: event.club?.name ?? '' },
    { delay, jobId: `reminder:${eventId}` }
  );

  console.log(
    `[ReminderWorker] Scheduled reminder for event "${event.title}" at ${reminderTime.toISOString()}`
  );
}

// ── Cancel a scheduled reminder ───────────────────────────────────────────────
export async function cancelEventReminder(eventId: string) {
  const job = await reminderQueue.getJob(`reminder:${eventId}`);
  if (job) {
    await job.remove();
    console.log(`[ReminderWorker] Cancelled reminder for event ${eventId}`);
  }
}

// ── Reminder job processor ────────────────────────────────────────────────────
reminderQueue.process('send_event_reminders', async (job) => {
  const { eventId, clubName } = job.data;

  console.log(`[ReminderWorker] Processing reminders for event ${eventId}`);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { club: true },
  });

  if (!event) {
    console.warn(`[ReminderWorker] Event ${eventId} not found — skipping`);
    return;
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { event_id: eventId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  console.log(`[ReminderWorker] Sending reminders to ${registrations.length} registrants`);

  const emailJobs = registrations.map(reg => ({
    name: EmailJobType.EVENT_REMINDER,
    data: {
      userId: reg.user.id,
      userEmail: reg.user.email,
      userName: reg.user.name,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date.toISOString(),
      eventVenue: event.venue,
      clubName: event.club?.name ?? clubName,
    },
  }));

  const notifJobs = registrations.map(reg => ({
    name: NotificationJobType.IN_APP,
    data: {
      userId: reg.user.id,
      title: `🕐 Event tomorrow: ${event.title}`,
      body: `Don't forget! "${event.title}" is tomorrow at ${event.venue}. See you there!`,
      type: NotificationType.event_reminder,
    },
  }));

  await Promise.all([
    emailQueue.addBulk(emailJobs),
    notificationQueue.addBulk(notifJobs),
  ]);

  console.log(`[ReminderWorker] ✅ Queued ${registrations.length} reminder emails + notifications for "${event.title}"`);
});

reminderQueue.on('completed', (job) => {
  console.log(`[ReminderWorker] Job ${job.id} completed`);
});

reminderQueue.on('failed', (job, err) => {
  console.error(`[ReminderWorker] Job ${job.id} FAILED:`, err.message);
});

console.log('[ReminderWorker] Worker started — listening for reminder jobs');