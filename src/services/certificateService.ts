// src/services/certificateService.ts
// Phase 3 — Certificate generation, storage and email delivery

import { PrismaClient } from '@prisma/client';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import { emailQueue, EmailJobType } from '../config/queues';
import { checkAndAwardBadges } from './profileService';

const prisma = new PrismaClient();

export interface CertificateJobPayload {
  userId: string;
  eventId: string;
  clubId: string;
  pointsAwarded: number;
  hoursAwarded: number;
  multiplier: number;
  tier: string;
}

/**
 * Generates a certificate PDF, persists the record, and queues an email.
 * Called from the certificateQueue worker after attendance is confirmed.
 */
export async function issueCertificate(payload: CertificateJobPayload): Promise<void> {
  const { userId, eventId, clubId, pointsAwarded, hoursAwarded, multiplier, tier } = payload;

  // Prevent duplicate certificates
  const existing = await prisma.certificate.findUnique({
    where: { user_id_event_id: { user_id: userId, event_id: eventId } },
  });
  if (existing) return;

  const [user, event, club] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } }),
    prisma.event.findUniqueOrThrow({ where: { id: eventId }, select: { title: true, date: true } }),
    prisma.club.findUniqueOrThrow({ where: { id: clubId }, select: { name: true } }),
  ]);

  const pdfBuffer = await generateCertificatePDF({
    studentName: user.name,
    eventTitle: event.title,
    eventDate: event.date,
    clubName: club.name,
    pointsAwarded,
    hoursAwarded,
    multiplier,
    tier,
  });

  // Persist certificate record (pdf_url set later if uploaded to Cloudinary)
  await prisma.certificate.create({
    data: {
      user_id: userId,
      event_id: eventId,
      club_id: clubId,
      points_awarded: pointsAwarded,
      hours_awarded: hoursAwarded,
      multiplier_used: multiplier,
      pdf_url: null, // populated after optional Cloudinary upload
    },
  });

  // Queue email with PDF attachment
  await emailQueue.add(EmailJobType.CERTIFICATE, {
    to: user.email,
    studentName: user.name,
    eventTitle: event.title,
    clubName: club.name,
    pdfBase64: pdfBuffer.toString('base64'),
  });

  // Check & award badges
  await checkAndAwardBadges(userId, eventId);
}

/**
 * Returns the certificate PDF buffer for download by a specific user.
 * Re-generates on-the-fly if pdf_url is null (avoids storing large files).
 */
export async function downloadCertificate(certId: string, requestingUserId: string): Promise<Buffer> {
  const cert = await prisma.certificate.findUniqueOrThrow({ where: { id: certId } });

  if (cert.user_id !== requestingUserId) {
    throw Object.assign(new Error('Access denied'), { status: 403 });
  }

  const [user, event, club] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: cert.user_id }, select: { name: true } }),
    prisma.event.findUniqueOrThrow({ where: { id: cert.event_id }, select: { title: true, date: true } }),
    prisma.club.findUniqueOrThrow({ where: { id: cert.club_id }, select: { name: true } }),
  ]);

  return generateCertificatePDF({
    studentName: user.name,
    eventTitle: event.title,
    eventDate: event.date,
    clubName: club.name,
    pointsAwarded: cert.points_awarded,
    hoursAwarded: cert.hours_awarded,
    multiplier: cert.multiplier_used,
    tier: _multiplierToTier(cert.multiplier_used),
  });
}

function _multiplierToTier(m: number): string {
  if (m >= 3) return 'core';
  if (m >= 2) return 'working_committee';
  if (m > 1)  return 'member';
  return 'non_member';
}
