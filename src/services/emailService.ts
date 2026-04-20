// server/src/services/emailService.ts
// Nodemailer + SendGrid email service.
// Phase 1C: registration/reminder emails move to Bull Queue workers.
// Verification and password reset remain synchronous (user is waiting).

import nodemailer from "nodemailer";

// ── Lazy transporter — env-configurable for dev (Mailtrap) vs prod (SendGrid) ─
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.sendgrid.net",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "apikey",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

const FROM_EMAIL    = process.env.EMAIL_FROM   || "noreply@clubhub.app";
const FRONTEND_URL  = process.env.FRONTEND_URL || "https://clubhub.app";

// ── Base HTML template ────────────────────────────────────────────────────────
function baseTemplate(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ClubHub</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px;
                 overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
    .body { padding: 32px; color: #374151; line-height: 1.6; }
    .body h2 { font-size: 20px; margin-top: 0; color: #111827; }
    .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;
                 padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0;
                border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #6b7280; font-size: 13px; }
    .value { color: #111827; font-size: 13px; }
    .btn { display: inline-block; background: #6366f1; color: #fff !important;
           text-decoration: none; padding: 12px 28px; border-radius: 8px;
           font-weight: 600; margin: 16px 0; }
    .footer { background: #f9fafb; padding: 20px 32px; text-align: center;
              color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  ${preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>`
    : ""}
  <div class="container">
    <div class="header"><h1>🎓 ClubHub</h1></div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>ClubHub — Campus Club &amp; Event Management</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Date formatter — IST for Indian campus audience ───────────────────────────
function formatDate(date: Date): string {
  return date.toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

async function send(to: string, subject: string, html: string): Promise<void> {
  await getTransporter().sendMail({
    from: `ClubHub <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}

// ── Email Verification (synchronous — user is waiting on this) ────────────────
export async function sendVerificationEmail(options: {
  to: string;
  userName: string;
  token: string;
}): Promise<void> {
  const verifyUrl = `${FRONTEND_URL}/auth/verify-email?token=${options.token}`;
  await send(
    options.to,
    "Verify your ClubHub email address",
    baseTemplate(
      `<h2>Verify Your Email ✉️</h2>
      <p>Hi ${options.userName},</p>
      <p>Welcome to ClubHub! Please verify your email address to get started.</p>
      <a href="${verifyUrl}" class="btn">Verify Email Address →</a>
      <p style="font-size:13px;color:#9ca3af;">
        This link expires in 60 minutes. If you didn't create an account, ignore this email.
      </p>`,
      "Verify your ClubHub email to get started"
    )
  );
}

// ── Password Reset (synchronous — user is waiting on this) ───────────────────
export async function sendPasswordResetEmail(options: {
  to: string;
  userName: string;
  token: string;
}): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${options.token}`;
  await send(
    options.to,
    "Reset your ClubHub password",
    baseTemplate(
      `<h2>Reset Your Password 🔐</h2>
      <p>Hi ${options.userName},</p>
      <p>You requested a password reset for your ClubHub account.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <p style="font-size:13px;color:#9ca3af;">
        This link expires in 60 minutes. If you didn't request this, ignore this email.
      </p>`,
      "Reset your ClubHub password"
    )
  );
}

// ── Core Member Welcome (synchronous — sent on successful core-join) ──────────
export async function sendWelcomeCoreEmail(options: {
  to: string;
  userName: string;
  clubName: string;
  role: string;
  tenureStart: string;
  tenureEnd: string;
}): Promise<void> {
  const { userName, clubName, role, tenureStart, tenureEnd } = options;
  await send(
    options.to,
    `Welcome to ${clubName} Core Team!`,
    baseTemplate(
      `<h2>Welcome to the Core Team! 🚀</h2>
      <p>Hi ${userName},</p>
      <p>You've been activated as a core member of <strong>${clubName}</strong>.</p>
      <div class="info-card">
        <div class="info-row"><span class="label">Club</span><span class="value">${clubName}</span></div>
        <div class="info-row"><span class="label">Role</span><span class="value">${role}</span></div>
        <div class="info-row"><span class="label">Tenure Start</span><span class="value">${tenureStart}</span></div>
        <div class="info-row"><span class="label">Tenure End</span><span class="value">${tenureEnd}</span></div>
      </div>
      <a href="${FRONTEND_URL}/dashboard" class="btn">Go to Dashboard →</a>`,
      `You're now a core member of ${clubName}`
    )
  );
}

// ── Event Registration Confirmation (→ Bull Queue in Phase 1C) ────────────────
export async function sendEventRegistrationEmail(options: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: Date;
  eventVenue: string;
  clubName: string;
  eventId: string;
}): Promise<void> {
  const { userName, eventTitle, eventDate, eventVenue, clubName, eventId } = options;
  await send(
    options.to,
    `✅ Registered: ${eventTitle}`,
    baseTemplate(
      `<h2>You're registered! 🎉</h2>
      <p>Hi ${userName},</p>
      <p>Your registration for <strong>${eventTitle}</strong> by ${clubName} is confirmed.</p>
      <div class="info-card">
        <div class="info-row"><span class="label">Event</span><span class="value">${eventTitle}</span></div>
        <div class="info-row"><span class="label">Club</span><span class="value">${clubName}</span></div>
        <div class="info-row"><span class="label">Date & Time</span><span class="value">${formatDate(eventDate)}</span></div>
        <div class="info-row"><span class="label">Venue</span><span class="value">${eventVenue}</span></div>
      </div>
      <p>Attend and mark your attendance via QR or PIN to earn your AICTE points!</p>
      <a href="${FRONTEND_URL}/events/${eventId}" class="btn">View Event Details →</a>`,
      `You're registered for ${eventTitle}`
    )
  );
}

// ── 24-Hour Reminder (→ Bull Queue in Phase 1C) ───────────────────────────────
export async function sendEventReminderEmail(options: {
  to: string;
  userName: string;
  eventTitle: string;
  eventDate: Date;
  eventVenue: string;
  clubName: string;
  eventId: string;
}): Promise<void> {
  const { userName, eventTitle, eventDate, eventVenue, clubName, eventId } = options;
  await send(
    options.to,
    `⏰ Reminder: ${eventTitle} — Tomorrow`,
    baseTemplate(
      `<h2>Event tomorrow — don't miss it! ⏰</h2>
      <p>Hi ${userName},</p>
      <p><strong>${eventTitle}</strong> by ${clubName} is happening tomorrow!</p>
      <div class="info-card">
        <div class="info-row"><span class="label">Event</span><span class="value">${eventTitle}</span></div>
        <div class="info-row"><span class="label">Club</span><span class="value">${clubName}</span></div>
        <div class="info-row"><span class="label">Date & Time</span><span class="value">${formatDate(eventDate)}</span></div>
        <div class="info-row"><span class="label">Venue</span><span class="value">${eventVenue}</span></div>
      </div>
      <p><strong>Remember:</strong> Points are awarded only on attendance — bring your phone for QR/PIN!</p>
      <a href="${FRONTEND_URL}/events/${eventId}" class="btn">View Event →</a>`,
      `Reminder: ${eventTitle} is tomorrow`
    )
  );
}

// ── Event Cancellation (→ Bull Queue in Phase 1C) ─────────────────────────────
export async function sendEventCancellationEmail(options: {
  to: string;
  userName: string;
  eventTitle: string;
  reason?: string;
}): Promise<void> {
  const { userName, eventTitle, reason } = options;
  await send(
    options.to,
    `❌ Event Cancelled: ${eventTitle}`,
    baseTemplate(
      `<h2>Event Cancelled</h2>
      <p>Hi ${userName},</p>
      <p>Unfortunately, <strong>${eventTitle}</strong> has been cancelled.</p>
      ${reason
        ? `<div class="info-card"><div class="info-row">
            <span class="label">Reason</span>
            <span class="value">${reason}</span>
           </div></div>`
        : ""}
      <p>We apologize for the inconvenience. Check ClubHub for other upcoming events.</p>
      <a href="${FRONTEND_URL}/events" class="btn">Browse Events →</a>`,
      `${eventTitle} has been cancelled`
    )
  );
}