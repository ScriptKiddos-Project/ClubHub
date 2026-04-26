import { sendEmail } from '../config/email';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function formatDate(date: Date): string {
  return date.toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export async function sendVerificationEmail(options: {
  to: string;
  userName: string;
  token: string;
}): Promise<void> {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${options.token}`;
  await sendEmail({
    to: options.to,
    subject: 'Verify your ClubHub email address',
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;padding:32px;">
        <h1 style="color:#6366f1;">ClubHub</h1>
        <h2>Verify Your Email ✉️</h2>
        <p>Hi ${options.userName},</p>
        <p>Welcome to ClubHub! Click below to verify your email address.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
          Verify Email Address →
        </a>
        <p style="color:#9ca3af;font-size:13px;">This link expires in 60 minutes.</p>
      </div>
    </body></html>`,
  });
}

export async function sendPasswordResetEmail(options: {
  to: string;
  userName: string;
  token: string;
}): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${options.token}`;
  await sendEmail({
    to: options.to,
    subject: 'Reset your ClubHub password',
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;padding:32px;">
        <h1 style="color:#6366f1;">ClubHub</h1>
        <h2>Reset Your Password 🔐</h2>
        <p>Hi ${options.userName},</p>
        <p>Click below to reset your password. This link expires in 60 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
          Reset Password →
        </a>
      </div>
    </body></html>`,
  });
}

export async function sendWelcomeCoreEmail(options: {
  to: string;
  userName: string;
  clubName: string;
  role: string;
  tenureStart: string;
  tenureEnd: string;
}): Promise<void> {
  await sendEmail({
    to: options.to,
    subject: `Welcome to ${options.clubName} Core Team!`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;padding:32px;">
        <h1 style="color:#6366f1;">ClubHub</h1>
        <h2>Welcome to the Core Team! 🚀</h2>
        <p>Hi ${options.userName},</p>
        <p>You're now <strong>${options.role}</strong> at <strong>${options.clubName}</strong>.</p>
        <p>Tenure: ${options.tenureStart} → ${options.tenureEnd}</p>
        <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
          Go to Dashboard →
        </a>
      </div>
    </body></html>`,
  });
}

export async function sendEventRegistrationEmail(options: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: Date;
  eventVenue: string;
  clubName: string;
  eventId: string;
}): Promise<void> {
  await sendEmail({
    to: options.to,
    subject: `✅ Registered: ${options.eventTitle}`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;padding:32px;">
        <h1 style="color:#6366f1;">ClubHub</h1>
        <h2>You're registered! 🎉</h2>
        <p>Hi ${options.userName},</p>
        <p>Your registration for <strong>${options.eventTitle}</strong> by ${options.clubName} is confirmed.</p>
        <p>📅 ${formatDate(options.eventDate)} &nbsp;|&nbsp; 📍 ${options.eventVenue}</p>
        <a href="${FRONTEND_URL}/events/${options.eventId}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
          View Event →
        </a>
      </div>
    </body></html>`,
  });
}

export async function sendEventReminderEmail(options: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: Date;
  eventVenue: string;
  clubName: string;
  eventId: string;
}): Promise<void> {
  await sendEmail({
    to: options.to,
    subject: `⏰ Reminder: ${options.eventTitle} — Tomorrow`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;padding:32px;">
        <h1 style="color:#6366f1;">ClubHub</h1>
        <h2>Event tomorrow! ⏰</h2>
        <p>Hi ${options.userName},</p>
        <p><strong>${options.eventTitle}</strong> by ${options.clubName} is tomorrow!</p>
        <p>📅 ${formatDate(options.eventDate)} &nbsp;|&nbsp; 📍 ${options.eventVenue}</p>
        <a href="${FRONTEND_URL}/events/${options.eventId}" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
          View Event →
        </a>
      </div>
    </body></html>`,
  });
}

export async function sendEventCancellationEmail(options: {
  to: string;
  userName: string;
  eventTitle: string;
  reason?: string;
}): Promise<void> {
  await sendEmail({
    to: options.to,
    subject: `❌ Event Cancelled: ${options.eventTitle}`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;padding:32px;">
        <h1 style="color:#6366f1;">ClubHub</h1>
        <h2>Event Cancelled</h2>
        <p>Hi ${options.userName},</p>
        <p><strong>${options.eventTitle}</strong> has been cancelled.</p>
        ${options.reason ? `<p>Reason: ${options.reason}</p>` : ''}
        <a href="${FRONTEND_URL}/events" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
          Browse Events →
        </a>
      </div>
    </body></html>`,
  });
}