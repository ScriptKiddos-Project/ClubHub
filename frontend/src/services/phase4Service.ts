// services/phase4Service.ts
// Raw Axios calls for all Phase 4 endpoints.
// Imports `api` from the existing Axios instance at services/api.ts.

import api from './api';
import type {
  ChatRoom,
  ChatMessage,
  Announcement,
  RecruitmentForm,
  Application,
  ApplicationPayload,
  InterviewSlot,
  ScheduleInterviewPayload,
  InterviewResultPayload,
  NotificationPreferences,
} from '../types/phase4';

// ─── CHAT ROOMS ──────────────────────────────────────────────────────────────

/** List all chat rooms the current user belongs to */
export const fetchChatRooms = async (): Promise<ChatRoom[]> => {
  const { data } = await api.get<{ success: true; data: ChatRoom[] }>('/chat/rooms');
  return data.data;
};

/** Get recent message history for a room (before joining Socket.io) */
export const fetchRoomHistory = async (
  roomId: string,
  limit = 50
): Promise<ChatMessage[]> => {
  const { data } = await api.get<{ success: true; data: ChatMessage[] }>(
    `/chat/rooms/${roomId}/messages`,
    { params: { limit } }
  );
  return data.data;
};

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

/** Get all announcements for clubs the student belongs to */
export const fetchAnnouncements = async (clubId?: string): Promise<Announcement[]> => {
  const { data } = await api.get<{ success: true; data: Announcement[] }>(
    '/chat/announcements',
    { params: clubId ? { clubId } : {} }
  );
  return data.data;
};

/** Admin: post a new club announcement (Socket.io broadcast + DB persist) */
export const postAnnouncement = async (
  clubId: string,
  payload: { title: string; body: string }
): Promise<Announcement> => {
  const { data } = await api.post<{ success: true; data: Announcement }>(
    `/clubs/${clubId}/announcements`,
    payload
  );
  return data.data;
};

// ─── RECRUITMENT ─────────────────────────────────────────────────────────────

/** Fetch open recruitment form for a club */
export const fetchRecruitmentForm = async (clubId: string): Promise<RecruitmentForm | null> => {
  try {
    const { data } = await api.get<{ success: true; data: RecruitmentForm }>(
      `/clubs/${clubId}/applications/form`
    );
    return data.data;
  } catch {
    return null;
  }
};

/** Create or update recruitment form (admin) */
export const upsertRecruitmentForm = async (
  clubId: string,
  payload: Omit<RecruitmentForm, 'id' | 'clubId' | 'clubName'>
): Promise<RecruitmentForm> => {
  const { data } = await api.put<{ success: true; data: RecruitmentForm }>(
    `/clubs/${clubId}/applications/form`,
    payload
  );
  return data.data;
};

/** Student: submit an application */
export const submitApplication = async (
  clubId: string,
  payload: ApplicationPayload
): Promise<Application> => {
  const { data } = await api.post<{ success: true; data: Application }>(
    `/clubs/${clubId}/applications`,
    payload
  );
  return data.data;
};

/** Admin: list all applications for a club */
export const fetchApplications = async (clubId: string): Promise<Application[]> => {
  const { data } = await api.get<{ success: true; data: Application[] }>(
    `/clubs/${clubId}/applications`
  );
  return data.data;
};

/** Admin: update application status (shortlisted / rejected) */
export const updateApplicationStatus = async (
  clubId: string,
  applicationId: string,
  status: 'shortlisted' | 'rejected',
  notes?: string
): Promise<Application> => {
  const { data } = await api.patch<{ success: true; data: Application }>(
    `/clubs/${clubId}/applications/${applicationId}`,
    { status, notes }
  );
  return data.data;
};

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────

/** Admin: schedule an interview slot */
export const scheduleInterview = async (
  clubId: string,
  payload: ScheduleInterviewPayload
): Promise<InterviewSlot> => {
  const { data } = await api.post<{ success: true; data: InterviewSlot }>(
    `/clubs/${clubId}/interviews`,
    payload
  );
  return data.data;
};

/** Admin: list all interview slots for a club */
export const fetchInterviews = async (clubId: string): Promise<InterviewSlot[]> => {
  const { data } = await api.get<{ success: true; data: InterviewSlot[] }>(
    `/clubs/${clubId}/interviews`
  );
  return data.data;
};

/** Admin: record interview result (accepted → triggers access code flow) */
export const recordInterviewResult = async (
  interviewId: string,
  payload: InterviewResultPayload
): Promise<InterviewSlot> => {
  const { data } = await api.patch<{ success: true; data: InterviewSlot }>(
    `/interviews/${interviewId}/result`,
    payload
  );
  return data.data;
};

// ─── NOTIFICATION PREFERENCES ────────────────────────────────────────────────

export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const { data } = await api.get<{ success: true; data: NotificationPreferences }>(
    '/users/me/notification-preferences'
  );
  return data.data;
};

export const saveNotificationPreferences = async (
  prefs: NotificationPreferences
): Promise<NotificationPreferences> => {
  const { data } = await api.put<{ success: true; data: NotificationPreferences }>(
    '/users/me/notification-preferences',
    prefs
  );
  return data.data;
};