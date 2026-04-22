// src/config/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.EMAIL_FROM_NAME || 'ClubHub'} <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`;

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (error) {
    console.error('❌ Resend error:', error);
    throw new Error(error.message);
  }

  console.log('✅ Email sent:', data?.id);
}

// ── HTML Templates ────────────────────────────────────────────────────────────
const emailTemplates = {
  'verify-email': (data: Record<string, string | number | boolean>) => ({
    subject: 'Verify your ClubHub email',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #6366f1;">ClubHub</h1>
          <h2 style="color: #1f2937;">Verify Your Email Address</h2>
          <p style="color: #4b5563;">Hi ${data.name},</p>
          <p style="color: #4b5563;">Thanks for registering! Click the button below to verify your email.</p>
          <a href="${data.verifyUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
            Verify Email
          </a>
          <p style="color: #9ca3af; font-size: 14px;">This link expires in 60 minutes.</p>
        </div>
      </body>
      </html>
    `,
  }),

  'reset-password': (data: Record<string, string | number | boolean>) => ({
    subject: 'Reset your ClubHub password',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #6366f1;">ClubHub</h1>
          <h2 style="color: #1f2937;">Reset Your Password</h2>
          <p style="color: #4b5563;">Hi ${data.name},</p>
          <p style="color: #4b5563;">Click below to reset your password. Link expires in 60 minutes.</p>
          <a href="${data.resetUrl}" style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">
            Reset Password
          </a>
        </div>
      </body>
      </html>
    `,
  }),

  'event-confirmation': (data: Record<string, string | number | boolean>) => ({
    subject: `Registration confirmed: ${data.eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #6366f1;">ClubHub</h1>
          <h2 style="color: #10b981;">You're Registered! 🎉</h2>
          <p>Hi ${data.name}, you're registered for <strong>${data.eventTitle}</strong>.</p>
          <p>📅 ${data.eventDate} &nbsp;|&nbsp; 📍 ${data.eventVenue} &nbsp;|&nbsp; 🏆 ${data.pointsReward} pts</p>
        </div>
      </body>
      </html>
    `,
  }),

  'event-reminder': (data: Record<string, string | number | boolean>) => ({
    subject: `Reminder: ${data.eventTitle} is tomorrow!`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #6366f1;">ClubHub</h1>
          <h2 style="color: #f59e0b;">Event Tomorrow ⏰</h2>
          <p>Hi ${data.name}, <strong>${data.eventTitle}</strong> is tomorrow!</p>
          <p>📅 ${data.eventDate} &nbsp;|&nbsp; 📍 ${data.eventVenue}</p>
        </div>
      </body>
      </html>
    `,
  }),

  'welcome-core-member': (data: Record<string, string | number | boolean>) => ({
    subject: `Welcome to ${data.clubName} Core Team!`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #6366f1;">ClubHub</h1>
          <h2 style="color: #10b981;">Welcome to the Core Team! 🎊</h2>
          <p>Hi ${data.name}, you're now <strong>${data.role}</strong> at <strong>${data.clubName}</strong>.</p>
          <p>Tenure: ${data.tenureStart} → ${data.tenureEnd}</p>
        </div>
      </body>
      </html>
    `,
  }),
};

export function buildEmailFromTemplate(
  templateName: keyof typeof emailTemplates,
  data: Record<string, string | number | boolean>
): { subject: string; html: string } {
  const template = emailTemplates[templateName];
  if (!template) throw new Error(`Unknown email template: ${templateName}`);
  return template(data);
}