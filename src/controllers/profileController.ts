// src/controllers/profileController.ts
// Phase 3 — Profile / Achievements / Resume controller

import { Request, Response } from 'express';
import * as profileService from '../services/profileService';
import * as certificateService from '../services/certificateService';

// ── GET /api/v1/users/me/achievements ─────────────────────────────────────────
export async function getAchievements(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const data = await profileService.getAchievements(userId);
    return res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    return res.status(error.status ?? 500).json({
      success: false,
      error: { code: 'ACHIEVEMENTS_ERROR', message: error.message },
    });
  }
}

// ── GET /api/v1/users/me/points-history ──────────────────────────────────────
export async function getPointsHistory(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const page  = parseInt(String(req.query.page  ?? '1'),  10);
    const limit = parseInt(String(req.query.limit ?? '20'), 10);

    const data = await profileService.getPointsHistory(userId, page, limit);
    return res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    return res.status(error.status ?? 500).json({
      success: false,
      error: { code: 'POINTS_HISTORY_ERROR', message: error.message },
    });
  }
}

// ── POST /api/v1/users/me/resume-export ──────────────────────────────────────
// Returns a JSON { downloadUrl, expiresAt } so the frontend can trigger a
// browser download without Axios having to handle a raw binary stream.
// The PDF is generated, saved to a temp path or object-storage, and a
// short-lived signed URL (or a data-URL for local dev) is returned.
export async function exportResume(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const pdfBuffer = await profileService.exportResumePDF(userId);

    // Convert buffer → base64 data-URL so any environment works out of the box.
    // In production, swap this for a signed S3/GCS URL with a 5-minute TTL.
    const base64 = pdfBuffer.toString('base64');
    const downloadUrl = `data:application/pdf;base64,${base64}`;

    // expiresAt is informational; for data-URLs it doesn't expire.
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return res.status(200).json({
      success: true,
      data: { downloadUrl, expiresAt },
    });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    return res.status(error.status ?? 500).json({
      success: false,
      error: { code: 'RESUME_EXPORT_ERROR', message: error.message },
    });
  }
}

// ── GET /api/v1/users/me/certificates ────────────────────────────────────────
export async function getCertificates(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const certificates = await prisma.certificate.findMany({
      where: { user_id: userId },
      orderBy: { issued_at: 'desc' },
    });

    return res.status(200).json({ success: true, data: certificates });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    return res.status(error.status ?? 500).json({
      success: false,
      error: { code: 'CERTIFICATES_ERROR', message: error.message },
    });
  }
}

// ── GET /api/v1/users/me/certificates/:certId/download ───────────────────────
export async function downloadCertificate(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const { certId } = req.params;

    const pdfBuffer = await certificateService.downloadCertificate(certId, userId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Certificate.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    return res.status(error.status ?? 500).json({
      success: false,
      error: { code: 'CERTIFICATE_DOWNLOAD_ERROR', message: error.message },
    });
  }
}