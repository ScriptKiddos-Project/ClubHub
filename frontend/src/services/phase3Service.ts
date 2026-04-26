// services/phase3Service.ts
// All raw API calls for Phase 3 features.
// Import `api` from the existing Axios instance.

import api from './api';
import type {
  GeoAttendancePayload,
  GeoAttendanceResult,
  PointsHistoryResponse,
  AchievementsResponse,
  CertificatesResponse,
  ResumeExportResponse,
  AttendanceMethodConfig,
  EventVenueCoords,
} from '../types/phase3';

// ─── GEO-FENCE ATTENDANCE ────────────────────────────────────────────────────

/** Submit student GPS coords; server runs Haversine check */
export const submitGeoAttendance = async (
  eventId: string,
  payload: GeoAttendancePayload
): Promise<GeoAttendanceResult> => {
  const { data } = await api.post<{ success: true; data: GeoAttendanceResult }>(
    `/events/${eventId}/geo-attendance`,
    payload
  );
  return data.data;
};

/** Fetch venue GPS + configured fence radius for a given event */
export const fetchEventVenueCoords = async (eventId: string): Promise<EventVenueCoords> => {
  const { data } = await api.get<{ success: true; data: EventVenueCoords }>(
    `/events/${eventId}/venue-coords`
  );
  return data.data;
};

// ─── POINTS HISTORY ──────────────────────────────────────────────────────────

export const fetchPointsHistory = async (
  page = 1,
  limit = 20
): Promise<PointsHistoryResponse> => {
  const { data } = await api.get<{ success: true; data: PointsHistoryResponse }>(
    `/users/me/points-history`,
    { params: { page, limit } }
  );
  return data.data;
};

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

export const fetchAchievements = async (): Promise<AchievementsResponse> => {
  const { data } = await api.get<{ success: true; data: AchievementsResponse }>(
    `/users/me/achievements`
  );
  return data.data;
};

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────

export const fetchCertificates = async (): Promise<CertificatesResponse> => {
  const { data } = await api.get<{ success: true; data: CertificatesResponse }>(
    `/users/me/achievements`
  );
  return { certificates: data.data.certificates };
};

export const downloadCertificate = async (certificateId: string): Promise<string> => {
  const { data } = await api.get<{ success: true; data: { downloadUrl: string } }>(
    `/users/me/certificates/${certificateId}/download`
  );
  return data.data.downloadUrl;
};

// ─── RESUME EXPORT ────────────────────────────────────────────────────────────

export const requestResumeExport = async (): Promise<ResumeExportResponse> => {
  const { data } = await api.post<{ success: true; data: ResumeExportResponse }>(
    `/users/me/resume-export`
  );
  return data.data;
};

// ─── ADMIN: ATTENDANCE METHOD CONFIG ─────────────────────────────────────────

export const fetchAttendanceMethodConfig = async (
  eventId: string
): Promise<AttendanceMethodConfig> => {
  const { data } = await api.get<{ success: true; data: AttendanceMethodConfig }>(
    `/events/${eventId}/attendance-config`
  );
  return data.data;
};

export const updateAttendanceMethodConfig = async (
  eventId: string,
  config: Omit<AttendanceMethodConfig, 'eventId'>
): Promise<AttendanceMethodConfig> => {
  const { data } = await api.put<{ success: true; data: AttendanceMethodConfig }>(
    `/events/${eventId}/attendance-config`,
    config
  );
  return data.data;
};
