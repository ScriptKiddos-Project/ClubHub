import api from './api';
import type { Event, CreateEventPayload, ApiResponse, PaginatedResponse, AttendanceRecord } from '../types';
import { normalizeEvent } from './normalizers';

const toApiEventType = (eventType: string) => (eventType === 'social' ? 'meetup' : eventType);
const combineDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();

export const eventService = {
  list: async (params?: {
    page?: number; limit?: number; clubId?: string;
    type?: string; date?: string; search?: string;
  }) => {
    const response = await api.get('/events', {
      params: {
        limit: params?.limit,
        club_id: params?.clubId,
        type: params?.type ? toApiEventType(params.type) : undefined,
      },
    });
    const items = Array.isArray(response.data.data) ? response.data.data.map(normalizeEvent) : [];

    return {
      ...response,
      data: {
        success: true,
        data: items,
        pagination: {
          page: Number(params?.page ?? 1),
          limit: Number(params?.limit ?? Math.max(items.length, 1)),
          total: items.length,
          totalPages: response.data.meta?.has_more
            ? Number(params?.page ?? 1) + 1
            : Number(params?.page ?? 1),
        },
      } satisfies PaginatedResponse<Event>,
    };
  },

  get: async (id: string) => {
    const response = await api.get<ApiResponse<Event>>(`/events/${id}`);
    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeEvent(response.data.data),
      },
    };
  },

  create: (payload: CreateEventPayload) =>
    api.post<ApiResponse<Event>>('/events', {
      club_id: payload.clubId,
      title: payload.title,
      description: payload.description,
      date: combineDateTime(payload.date, payload.startTime),
      end_date: combineDateTime(payload.date, payload.endTime),
      venue: payload.venue,
      capacity: payload.capacity,
      event_type: toApiEventType(payload.eventType),
      points_reward: payload.pointsReward,
      volunteer_hours: payload.volunteerHours,
      tags: payload.tags,
      is_published: true,
    }),

  update: (id: string, payload: Partial<CreateEventPayload>) =>
    api.put<ApiResponse<Event>>(`/events/${id}`, {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.date && payload.startTime ? { date: combineDateTime(payload.date, payload.startTime) } : {}),
      ...(payload.date && payload.endTime ? { end_date: combineDateTime(payload.date, payload.endTime) } : {}),
      ...(payload.venue !== undefined ? { venue: payload.venue } : {}),
      ...(payload.capacity !== undefined ? { capacity: payload.capacity } : {}),
      ...(payload.eventType !== undefined ? { event_type: toApiEventType(payload.eventType) } : {}),
      ...(payload.pointsReward !== undefined ? { points_reward: payload.pointsReward } : {}),
      ...(payload.volunteerHours !== undefined ? { volunteer_hours: payload.volunteerHours } : {}),
      ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
    }),

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
