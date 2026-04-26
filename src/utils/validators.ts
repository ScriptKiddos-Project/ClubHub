import { z } from 'zod';
import { AttendanceStatus } from '../types';

export const QRAttendanceSchema = z.object({
  qrData: z
    .string({ required_error: 'QR data is required' })
    .min(10, 'Invalid QR data'),
});

export const PINAttendanceSchema = z.object({
  pin: z
    .string({ required_error: 'PIN is required' })
    .regex(/^\d{4,6}$/, 'PIN must be 4-6 digits'),
});

export const ManualAttendanceSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  status: z.nativeEnum(AttendanceStatus, {
    errorMap: () => ({ message: `Status must be one of: ${Object.values(AttendanceStatus).join(', ')}` }),
  }),
});

export const BulkAttendanceSchema = z.object({
  items: z
    .array(
      z.object({
        userId: z.string().uuid('Invalid user ID'),
        status: z.nativeEnum(AttendanceStatus),
      })
    )
    .min(1, 'At least one attendance item is required')
    .max(500, 'Cannot process more than 500 items at once'),
});

export const NotificationReadSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});
export const GeoAttendanceSchema = z.object({
  lat: z
    .number({ required_error: 'lat is required', invalid_type_error: 'lat must be a number' })
    .min(-90, 'lat must be >= -90')
    .max(90,  'lat must be <= 90'),
  lon: z
    .number({ required_error: 'lon is required', invalid_type_error: 'lon must be a number' })
    .min(-180, 'lon must be >= -180')
    .max(180,  'lon must be <= 180'),
});

export type GeoAttendanceInput = z.infer<typeof GeoAttendanceSchema>;