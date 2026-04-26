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
    return res.status(200).json({ success: true, ...data });
  } catch (err: unknown) {
    const error = err as Error & { status?: number };
    return res.status(error.status ?? 500).json({
      success: false,
      error: { code: 'POINTS_HISTORY_ERROR', message: error.message },
    });
  }
}

// ── GET /api/v1/users/me/resume — download resume PDF ────────────────────────
export async function downloadResume(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const pdfBuffer = await profileService.exportResumePDF(userId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ClubHub_Resume.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
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
