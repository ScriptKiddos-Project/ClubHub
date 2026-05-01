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

// ── Phase 4: Application status email ────────────────────────────────────────

emailQueue.process(EmailJobType.APPLICATION_STATUS, async (job) => {
  const { to, userName, clubName, status, notes } = job.data;

  console.log(`[EmailWorker] Sending application status (${status}) to ${to}`);

  await transporter.sendMail({
    from: `"ClubHub" <${process.env.EMAIL_FROM ?? 'noreply@clubhub.app'}>`,
    to,
    subject: status === 'shortlisted'
      ? `🎉 You've been shortlisted — ${clubName}`
      : `Your application to ${clubName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#0f172a;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#6366f1;margin:0;letter-spacing:4px;font-size:14px;">CLUBHUB</h1>
          <h2 style="color:#fff;margin:12px 0 0;">
            ${status === 'shortlisted' ? '🎉 You\'ve been shortlisted!' : 'Application Update'}
          </h2>
        </div>
        <div style="background:#f8fafc;padding:28px;border-radius:0 0 12px 12px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${userName}</strong>,</p>
          ${status === 'shortlisted' ? `
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              Congratulations! Your application to <strong>${clubName}</strong> has been 
              <strong style="color:#2563eb;">shortlisted</strong>. 
              The team will be in touch to schedule your interview.
            </p>
          ` : `
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              Thank you for applying to <strong>${clubName}</strong>. After careful consideration, 
              we regret to inform you that your application was not selected this time.
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              We encourage you to apply again in future recruitment cycles!
            </p>
          `}
          ${notes ? `
            <div style="background:#f1f5f9;border-left:3px solid #6366f1;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:16px;">
              <p style="color:#475569;font-size:13px;margin:0;">
                <strong>Note from the team:</strong> ${notes}
              </p>
            </div>
          ` : ''}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
          <p style="color:#94a3b8;font-size:12px;text-align:center;">
            ClubHub — Campus Club & Event Management Platform
          </p>
        </div>
      </div>
    `,
  });

  console.log(`[EmailWorker] ✅ Application status email sent to ${to}`);
});

// ── Phase 4: Interview scheduled email ───────────────────────────────────────

emailQueue.process(EmailJobType.INTERVIEW_SCHEDULED, async (job) => {
  const { to, userName, clubName, slotTime, icsContent, location, meetLink, durationMins } = job.data;

  console.log(`[EmailWorker] Sending interview invite to ${to}`);

  const formattedTime = new Date(slotTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

  await transporter.sendMail({
    from: `"ClubHub" <${process.env.EMAIL_FROM ?? 'noreply@clubhub.app'}>`,
    to,
    subject: `📅 Interview Scheduled — ${clubName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#0f172a;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#6366f1;margin:0;letter-spacing:4px;font-size:14px;">CLUBHUB</h1>
          <h2 style="color:#fff;margin:12px 0 0;">📅 Interview Scheduled</h2>
        </div>
        <div style="background:#f8fafc;padding:28px;border-radius:0 0 12px 12px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${userName}</strong>,</p>
          <p style="color:#334155;font-size:15px;line-height:1.6;">
            Your interview with <strong>${clubName}</strong> has been scheduled.
          </p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#1e40af;font-size:14px;">
              🕐 <strong>${formattedTime}</strong>
            </p>
            ${durationMins ? `<p style="margin:0 0 8px;color:#1e40af;font-size:14px;">⏱ Duration: ${durationMins} minutes</p>` : ''}
            ${location ? `<p style="margin:0 0 8px;color:#1e40af;font-size:14px;">📍 ${location}</p>` : ''}
            ${meetLink ? `<p style="margin:0;color:#1e40af;font-size:14px;">🔗 <a href="${meetLink}" style="color:#2563eb;">${meetLink}</a></p>` : ''}
          </div>
          <p style="color:#64748b;font-size:13px;">
            A calendar invite is attached. Add it to your calendar to get a reminder.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
          <p style="color:#94a3b8;font-size:12px;text-align:center;">
            ClubHub — Campus Club & Event Management Platform
          </p>
        </div>
      </div>
    `,
    attachments: icsContent ? [
      {
        filename: 'interview.ics',
        content:  icsContent,
        contentType: 'text/calendar; method=REQUEST',
      },
    ] : [],
  });

  console.log(`[EmailWorker] ✅ Interview invite sent to ${to}`);
});

// ── Phase 4: Interview result email ──────────────────────────────────────────

emailQueue.process(EmailJobType.INTERVIEW_RESULT, async (job) => {
  const { to, userName, clubName, result, notes } = job.data;

  console.log(`[EmailWorker] Sending interview result (${result}) to ${to}`);

  await transporter.sendMail({
    from: `"ClubHub" <${process.env.EMAIL_FROM ?? 'noreply@clubhub.app'}>`,
    to,
    subject: result === 'accepted'
      ? `🎉 Welcome to ${clubName}!`
      : `Your interview with ${clubName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#0f172a;padding:32px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#6366f1;margin:0;letter-spacing:4px;font-size:14px;">CLUBHUB</h1>
          <h2 style="color:#fff;margin:12px 0 0;">
            ${result === 'accepted' ? '🎉 You\'re In!' : 'Interview Result'}
          </h2>
        </div>
        <div style="background:#f8fafc;padding:28px;border-radius:0 0 12px 12px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;">Hi <strong>${userName}</strong>,</p>
          ${result === 'accepted' ? `
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              Congratulations! We are thrilled to welcome you as a core member of 
              <strong>${clubName}</strong>. 🚀
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              You'll receive onboarding details from the team shortly.
            </p>
          ` : `
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              Thank you for interviewing with <strong>${clubName}</strong>. After careful 
              consideration, we will not be moving forward with your application at this time.
            </p>
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              We appreciate your time and encourage you to apply in future cycles.
            </p>
          `}
          ${notes ? `
            <div style="background:#f1f5f9;border-left:3px solid #6366f1;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:16px;">
              <p style="color:#475569;font-size:13px;margin:0;">
                <strong>Feedback:</strong> ${notes}
              </p>
            </div>
          ` : ''}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
          <p style="color:#94a3b8;font-size:12px;text-align:center;">
            ClubHub — Campus Club & Event Management Platform
          </p>
        </div>
      </div>
    `,
  });

  console.log(`[EmailWorker] ✅ Interview result email sent to ${to}`);
});