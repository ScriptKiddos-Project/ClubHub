import { emailQueue, EmailJobType } from '../config/queues';
import {
  sendEventRegistrationEmail,
  sendEventReminderEmail,
  sendEventCancellationEmail,
} from '../services/emailService';

emailQueue.process(EmailJobType.REGISTRATION_CONFIRMATION, async (job) => {
  const { userEmail, userName, eventTitle, eventDate, eventVenue, clubName, eventId } = job.data;

  console.log(`[EmailWorker] Sending registration confirmation to ${userEmail} for "${eventTitle}"`);

  await sendEventRegistrationEmail({
    to: userEmail,
    userName,
    eventTitle,
    eventDate: new Date(eventDate),
    eventVenue,
    clubName,
    eventId,
  });

  console.log(`[EmailWorker] ✅ Registration confirmation sent to ${userEmail}`);
});

emailQueue.process(EmailJobType.EVENT_REMINDER, async (job) => {
  const { userEmail, userName, eventTitle, eventDate, eventVenue, clubName, eventId } = job.data;

  console.log(`[EmailWorker] Sending event reminder to ${userEmail} for "${eventTitle}"`);

  await sendEventReminderEmail({
    to: userEmail,
    userName,
    eventTitle,
    eventDate: new Date(eventDate),
    eventVenue,
    clubName,
    eventId,
  });

  console.log(`[EmailWorker] ✅ Event reminder sent to ${userEmail}`);
});

emailQueue.process(EmailJobType.EVENT_CANCELLATION, async (job) => {
  const { userEmail, userName, eventTitle, reason } = job.data;

  console.log(`[EmailWorker] Sending cancellation email to ${userEmail} for "${eventTitle}"`);

  await sendEventCancellationEmail({ to: userEmail, userName, eventTitle, reason });

  console.log(`[EmailWorker] ✅ Cancellation email sent to ${userEmail}`);
});

emailQueue.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} (${job.name}) completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job.id} (${job.name}) FAILED:`, err.message);
});

console.log('[EmailWorker] Worker started — listening for email jobs');