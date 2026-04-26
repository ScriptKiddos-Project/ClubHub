// src/controllers/geoAttendanceController.ts
// Phase 3 — Geo-fence attendance controller

import { Request, Response } from 'express';
import * as geoAttendanceService from '../services/geoAttendanceService';

// ── POST /api/v1/events/:id/geo-attendance ────────────────────────────────────
export async function markGeoAttendance(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const { lat, lon } = req.body as { lat: number; lon: number };
    const userId = req.user!.id;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: '`lat` and `lon` must be numbers' },
      });
    }

    const result = await geoAttendanceService.markGeoAttendance(eventId, userId, lat, lon);

    return res.status(200).json({
      success: true,
      message: `Attendance marked as ${result.status} via geo-fence`,
      data: result,
    });
  } catch (err: unknown) {
    const error = err as Error & { status?: number; distanceMetres?: number; radiusMetres?: number };
    return res.status(error.status ?? 500).json({
      success: false,
      error: {
        code: 'GEO_ATTENDANCE_ERROR',
        message: error.message,
        ...(error.distanceMetres !== undefined && {
          details: {
            distanceMetres: error.distanceMetres,
            radiusMetres: error.radiusMetres,
          },
        }),
      },
    });
  }
}
