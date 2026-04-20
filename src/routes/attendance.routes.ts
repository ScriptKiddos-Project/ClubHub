import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { rbac } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  qrAttendanceRateLimiter,
  pinAttendanceRateLimiter,
  generalRateLimiter,
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

const router = Router();

// ── All routes require authentication ─────────────────────────────────────────
router.use(authenticate);

// ── QR Code Generation (Secretary only) ──────────────────────────────────────
router.post(
  '/:id/qr-code',
  rbac('secretary', 'super_admin'),
  generalRateLimiter,
  generateQRCode
);

// ── QR Attendance (Student / Member) ─────────────────────────────────────────
router.post(
  '/qr-attendance',
  rbac('student', 'member', 'secretary', 'event_manager'),
  qrAttendanceRateLimiter,
  validate(QRAttendanceSchema),
  markQRAttendance
);

// ── PIN Generation (Secretary only) ──────────────────────────────────────────
router.post(
  '/:id/generate-pin',
  rbac('secretary', 'super_admin'),
  generalRateLimiter,
  generatePIN
);

// ── PIN Attendance (Student / Member) ────────────────────────────────────────
router.post(
  '/:id/pin-attendance',
  rbac('student', 'member', 'secretary', 'event_manager'),
  pinAttendanceRateLimiter,
  validate(PINAttendanceSchema),
  markPINAttendance
);

// ── Manual Attendance (Secretary only) ───────────────────────────────────────
router.put(
  '/:id/manual-attendance',
  rbac('secretary', 'super_admin'),
  validate(ManualAttendanceSchema),
  markManualAttendance
);

// ── Bulk Attendance (Secretary only) ─────────────────────────────────────────
router.put(
  '/:id/bulk-attendance',
  rbac('secretary', 'super_admin'),
  validate(BulkAttendanceSchema),
  markBulkAttendance
);

// ── Attendance Report (Secretary + Event Manager + Super Admin) ───────────────
router.get(
  '/:id/attendance-report',
  rbac('secretary', 'event_manager', 'super_admin'),
  getAttendanceReport
);

export default router;