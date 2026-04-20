import api from './api';
import type { Event, CreateEventPayload, ApiResponse, PaginatedResponse, AttendanceRecord } from '../types';

export const eventService = {
  list: (params?: {
    page?: number; limit?: number; clubId?: string;
    type?: string; date?: string; search?: string;
  }) =>
    api.get<PaginatedResponse<Event>>('/events', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Event>>(`/events/${id}`),

  create: (payload: CreateEventPayload) =>
    api.post<ApiResponse<Event>>('/events', payload),

  update: (id: string, payload: Partial<CreateEventPayload>) =>
    api.put<ApiResponse<Event>>(`/events/${id}`, payload),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/events/${id}`),

  register: (id: string) =>
    api.post<ApiResponse<null>>(`/events/${id}/register`),

  unregister: (id: string) =>
    api.delete<ApiResponse<null>>(`/events/${id}/register`),

  getCalendar: (start: string, end: string) =>
    api.get<ApiResponse<unknown>>('/events/calendar', { params: { start, end } }),

  // Attendance
  generateQR: (id: string) =>
    api.post<ApiResponse<{ imageUrl: string; validUntil: string }>>(`/events/${id}/qr-code`),

  qrAttendance: (qrData: string) =>
    api.post<ApiResponse<null>>('/events/qr-attendance', { qrData }),

  generatePIN: (id: string) =>
    api.post<ApiResponse<{ pin: string; validUntil: string }>>(`/events/${id}/generate-pin`),

  pinAttendance: (id: string, pin: string) =>
    api.post<ApiResponse<null>>(`/events/${id}/pin-attendance`, { pin }),

  manualAttendance: (id: string, userId: string, status: string) =>
    api.put<ApiResponse<null>>(`/events/${id}/manual-attendance`, { userId, status }),

  bulkAttendance: (id: string, records: { userId: string; status: string }[]) =>
    api.put<ApiResponse<null>>(`/events/${id}/bulk-attendance`, { records }),

  getAttendanceReport: (id: string) =>
    api.get<ApiResponse<AttendanceRecord[]>>(`/events/${id}/attendance-report`),
};
