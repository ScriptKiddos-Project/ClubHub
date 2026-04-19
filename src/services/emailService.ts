// src/services/emailService.ts
import { sendEmail, buildEmailFromTemplate } from '../config/email';
import { SendEmailJobData } from '../types';

/**
 * Direct send (synchronous) — use only for critical emails where queue isn't available.
 * For all other emails, use emailQueue.add() from jobs/emailWorker.ts
 */
export async function sendEmailDirect(data: SendEmailJobData): Promise<void> {
  const { subject, html } = buildEmailFromTemplate(data.templateName, data.templateData);
  await sendEmail({ to: data.to, subject, html });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  await sendEmailDirect({
    to,
    subject: 'Verify your ClubHub email',
    templateName: 'verify-email',
    templateData: { name, verifyUrl },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  await sendEmailDirect({
    to,
    subject: 'Reset your ClubHub password',
    templateName: 'reset-password',
    templateData: { name, resetUrl },
  });
}

export async function sendEventConfirmationEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventVenue: string,
  pointsReward: number
): Promise<void> {
  await sendEmailDirect({
    to,
    subject: `Registration confirmed: ${eventTitle}`,
    templateName: 'event-confirmation',
    templateData: { name, eventTitle, eventDate, eventVenue, pointsReward },
  });
}

export async function sendWelcomeCoreEmail(
  to: string,
  name: string,
  clubName: string,
  role: string,
  tenureStart: string,
  tenureEnd: string
): Promise<void> {
  await sendEmailDirect({
    to,
    subject: `Welcome to ${clubName} Core Team!`,
    templateName: 'welcome-core-member',
    templateData: { name, clubName, role, tenureStart, tenureEnd },
  });
}
