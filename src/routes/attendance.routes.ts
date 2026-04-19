import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  qrAttendanceLimiter,
  pinAttendanceLimiter,
  generateLimiter,
  attendanceLimiter,
} from '../middleware/rateLimiter';
import {
  QRAttendanceSchema,
  PINAttendanceSchema,
  ManualAttendanceSchema,
  BulkAttendanceSchema,
} from '../utils/validators';
import {
  generateQRCode,
  markQRAttendance,
  generatePIN,
  markPINAttendance,
  markManualAttendance,
  markBulkAttendance,
  getAttendanceReport,
} from '../controllers/attendanceController';
import { UserRole } from '../types';

const router = Router();

// ── All routes require authentication ─────────────────────────────────────────
router.use(authenticate);

// ── QR Code Generation (Secretary only) ──────────────────────────────────────
router.post(
  '/:id/qr-code',
  authorize(UserRole.SECRETARY, UserRole.SUPER_ADMIN),
  generateLimiter,
  generateQRCode
);

// ── QR Attendance (Student / Member) ─────────────────────────────────────────
router.post(
  '/qr-attendance',
  authorize(UserRole.STUDENT, UserRole.MEMBER, UserRole.SECRETARY, UserRole.EVENT_MANAGER),
  qrAttendanceLimiter,
  validate(QRAttendanceSchema),
  markQRAttendance
);

// ── PIN Generation (Secretary only) ──────────────────────────────────────────
router.post(
  '/:id/generate-pin',
  authorize(UserRole.SECRETARY, UserRole.SUPER_ADMIN),
  generateLimiter,
  generatePIN
);

// ── PIN Attendance (Student / Member) ────────────────────────────────────────
router.post(
  '/:id/pin-attendance',
  authorize(UserRole.STUDENT, UserRole.MEMBER, UserRole.SECRETARY, UserRole.EVENT_MANAGER),
  pinAttendanceLimiter,
  validate(PINAttendanceSchema),
  markPINAttendance
);

// ── Manual Attendance (Secretary only) ───────────────────────────────────────
router.put(
  '/:id/manual-attendance',
  authorize(UserRole.SECRETARY, UserRole.SUPER_ADMIN),
  attendanceLimiter,
  validate(ManualAttendanceSchema),
  markManualAttendance
);

// ── Bulk Attendance (Secretary only) ─────────────────────────────────────────
router.put(
  '/:id/bulk-attendance',
  authorize(UserRole.SECRETARY, UserRole.SUPER_ADMIN),
  attendanceLimiter,
  validate(BulkAttendanceSchema),
  markBulkAttendance
);

// ── Attendance Report (Secretary + Event Manager + Super Admin) ───────────────
router.get(
  '/:id/attendance-report',
  authorize(UserRole.SECRETARY, UserRole.EVENT_MANAGER, UserRole.SUPER_ADMIN),
  getAttendanceReport
);

export default router;
