import nodemailer from 'nodemailer';
import { emailQueue, EmailJobType } from '../config/queues';
import {
  sendEventRegistrationEmail,
  sendEventReminderEmail,
  sendEventCancellationEmail,
} from '../services/emailService';

// ─── Certificate email transporter ───────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  auth: {
    user: process.env.SMTP_USER ?? 'apikey',
    pass: process.env.SMTP_PASS ?? '',
  },
});

export async function sendCertificateEmail(opts: {
  to: string;
  studentName: string;
  eventTitle: string;
  clubName: string;
  pdfBase64: string;
}) {
  const { to, studentName, eventTitle, clubName, pdfBase64 } = opts;

  await transporter.sendMail({
    from: `"ClubHub" <${process.env.EMAIL_FROM ?? 'noreply@clubhub.app'}>`,
    to,
    subject: `🎓 Your Certificate — ${eventTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#0f172a;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#6366f1;margin:0;letter-spacing:4px;font-size:14px;">CLUBHUB</h1>
          <h2 style="color:#fff;margin:12px 0 0;">Congratulations, ${studentName}!</h2>
        </div>
        <div style="background:#f8fafc;padding:28px;border-radius:0 0 12px 12px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;">
            Your certificate for attending <strong>${eventTitle}</strong>
            organised by <strong>${clubName}</strong> is attached to this email.
          </p>
          <p style="color:#64748b;font-size:13px;">Keep it safe — it includes your AICTE points and volunteer hours.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
          <p style="color:#94a3b8;font-size:12px;text-align:center;">
            ClubHub — Campus Club & Event Management Platform
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Certificate_${eventTitle.replace(/\s+/g, '_')}.pdf`,
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf',
      },
    ],
  });
}

// ─── Workers ──────────────────────────────────────────────────────────────────

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

// ── Phase 3: Certificate email ────────────────────────────────────────────────

emailQueue.process(EmailJobType.CERTIFICATE, async (job) => {
  const { to, studentName, eventTitle, clubName, pdfBase64 } = job.data;

  console.log(`[EmailWorker] Sending certificate to ${to} for "${eventTitle}"`);

  await sendCertificateEmail({ to, studentName, eventTitle, clubName, pdfBase64 });

  console.log(`[EmailWorker] ✅ Certificate sent to ${to}`);
});

// ─── Queue event listeners ────────────────────────────────────────────────────

emailQueue.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} (${job.name}) completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job.id} (${job.name}) FAILED:`, err.message);
});

console.log('[EmailWorker] Worker started — listening for email jobs');