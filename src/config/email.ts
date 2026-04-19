// src/config/email.ts
import nodemailer from 'nodemailer';
import { EmailPayload } from '../types';

// HTML Email Templates
const emailTemplates = {
  'verify-email': (data: Record<string, string | number | boolean>) => ({
    subject: 'Verify your ClubHub email',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
          <h1 style="color: #6366f1; margin-bottom: 8px;">ClubHub</h1>
          <h2 style="color: #1f2937;">Verify Your Email Address</h2>
          <p style="color: #4b5563;">Hi ${data.name},</p>
          <p style="color: #4b5563;">Thanks for registering! Click the button below to verify your email.</p>
          <a href="${data.verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Verify Email
          </a>
          <p style="color: #9ca3af; font-size: 14px;">This link expires in 60 minutes.</p>
          <p style="color: #9ca3af; font-size: 14px;">If you didn't create a ClubHub account, you can ignore this email.</p>
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
          <p style="color: #4b5563;">Click the button below to reset your password. This link expires in 60 minutes.</p>
          <a href="${data.resetUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 14px;">If you didn't request a password reset, ignore this email.</p>
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
          <p style="color: #4b5563;">Hi ${data.name},</p>
          <p style="color: #4b5563;">You've successfully registered for <strong>${data.eventTitle}</strong>.</p>
          <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #374151;"><strong>📅 Date:</strong> ${data.eventDate}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>📍 Venue:</strong> ${data.eventVenue}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>🏆 Points:</strong> ${data.pointsReward}</p>
          </div>
          <p style="color: #4b5563;">See you there!</p>
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
          <h2 style="color: #f59e0b;">Reminder: Event Tomorrow ⏰</h2>
          <p style="color: #4b5563;">Hi ${data.name},</p>
          <p style="color: #4b5563;">Just a reminder that <strong>${data.eventTitle}</strong> is happening tomorrow!</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #374151;"><strong>📅 Date:</strong> ${data.eventDate}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>📍 Venue:</strong> ${data.eventVenue}</p>
          </div>
          <p style="color: #4b5563;">Don't forget to attend and get your points!</p>
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
          <p style="color: #4b5563;">Hi ${data.name},</p>
          <p style="color: #4b5563;">You've been onboarded as <strong>${data.role}</strong> for <strong>${data.clubName}</strong>.</p>
          <p style="color: #4b5563;">Your tenure runs from ${data.tenureStart} to ${data.tenureEnd}.</p>
          <p style="color: #4b5563;">Log in to your dashboard to access your new role permissions.</p>
        </div>
      </body>
      </html>
    `,
  }),
};

// Nodemailer transporter using SendGrid SMTP
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'ClubHub'}" <${process.env.EMAIL_FROM}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}

export function buildEmailFromTemplate(
  templateName: keyof typeof emailTemplates,
  data: Record<string, string | number | boolean>
): { subject: string; html: string } {
  const template = emailTemplates[templateName];
  if (!template) throw new Error(`Unknown email template: ${templateName}`);
  return template(data);
}
