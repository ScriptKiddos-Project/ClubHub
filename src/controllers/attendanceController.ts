import { Request, Response } from 'express';
import * as attendanceService from '../services/attendanceService';
import { AttendanceStatus } from '../types';
import { AppError } from '../utils/AppError';

// ── POST /api/v1/events/:id/qr-code ──────────────────────────────────────────
export async function generateQRCode(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const actor_id = req.user!.id;

    const result = await attendanceService.generateQRCode(eventId, actor_id);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'QR_GENERATION_ERROR', message: error.message },
    });
  }
}

// ── POST /api/v1/events/qr-attendance ────────────────────────────────────────
export async function markQRAttendance(req: Request, res: Response) {
  try {
    const { qrData } = req.body;
    const userId = req.user!.id;

    const result = await attendanceService.markQRAttendance(qrData, userId);

    return res.status(200).json({
      success: true,
      message: 'Attendance marked successfully via QR code',
      data: result,
    });
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'QR_ATTENDANCE_ERROR', message: error.message },
    });
  }
}

// ── POST /api/v1/events/:id/generate-pin ─────────────────────────────────────
export async function generatePIN(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const actor_id = req.user!.id;

    const result = await attendanceService.generatePINForEvent(eventId, actor_id);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'PIN_GENERATION_ERROR', message: error.message },
    });
  }
}

// ── POST /api/v1/events/:id/pin-attendance ────────────────────────────────────
export async function markPINAttendance(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const { pin } = req.body;
    const userId = req.user!.id;

    const result = await attendanceService.markPINAttendance(eventId, pin, userId);

    return res.status(200).json({
      success: true,
      message: 'Attendance marked successfully via PIN',
      data: result,
    });
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'PIN_ATTENDANCE_ERROR', message: error.message },
    });
  }
}

// ── PUT /api/v1/events/:id/manual-attendance ──────────────────────────────────
export async function markManualAttendance(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const { userId: targetUserId, status } = req.body as { userId: string; status: AttendanceStatus };
    const actor_id = req.user!.id;

    const result = await attendanceService.markManualAttendance(eventId, targetUserId, status, actor_id);

    return res.status(200).json({
      success: true,
      message: `Attendance for user ${targetUserId} updated to ${status}`,
      data: result,
    });
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'MANUAL_ATTENDANCE_ERROR', message: error.message },
    });
  }
}

// ── PUT /api/v1/events/:id/bulk-attendance ────────────────────────────────────
export async function markBulkAttendance(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const { items } = req.body;
    const actor_id = req.user!.id;

    const result = await attendanceService.markBulkAttendance(eventId, items, actor_id);

    return res.status(200).json({
      success: true,
      message: `Bulk attendance processed: ${result.succeeded} succeeded, ${result.failed} failed`,
      data: result,
    });
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'BULK_ATTENDANCE_ERROR', message: error.message },
    });
  }
}

// ── GET /api/v1/events/:id/attendance-report ──────────────────────────────────
export async function getAttendanceReport(req: Request, res: Response) {
  try {
    const { id: eventId } = req.params;
    const result = await attendanceService.getAttendanceReport(eventId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const error = err instanceof AppError ? err : (err instanceof Error ? err : new Error(String(err)));
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: error.message },
    });
  }
}
