import api from './api';

// ─── Global analytics ─────────────────────────────────────────────────────────
// Matches getGlobalAnalytics() return shape exactly:
// { totalUsers, totalClubs, totalEvents, totalAttendance, attendanceRate, topEvents }
// topEvents items: { id, title, registration_count, date }
export interface GlobalTopEvent {
  id: string;
  title: string;
  registration_count: number; // backend field name — NOT "attendees"
  date: string;
}

export interface GlobalAnalytics {
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalAttendance: number;
  attendanceRate: number;     // 0–100 integer
  topEvents: GlobalTopEvent[];
}

// ─── Club analytics ───────────────────────────────────────────────────────────
// Matches getClubAnalytics() return shape exactly:
// { memberCount, totalEvents, attendanceRate, events, memberGrowth }
// memberGrowth items: { joined_at, _count: { user_id } } — raw groupBy output
// We reshape memberGrowth in the hook before passing to the chart.
export interface ClubAnalyticsRaw {
  memberCount: number;
  totalEvents: number;
  attendanceRate: number;
  events: { id: string; title: string; date: string; registration_count: number; capacity: number }[];
  memberGrowth: { joined_at: string; _count: { user_id: number } }[];
}

// Shaped version used by the UI
export interface ClubAnalytics {
  totalMembers: number;
  totalEvents: number;
  attendanceRate: number;
  memberCountOverTime: { month: string; count: number }[];
  events: ClubAnalyticsRaw['events'];
}

export const analyticsService = {
  getGlobalAnalytics: () =>
    api.get<{ success: boolean; data: GlobalAnalytics }>('/admin/analytics'),

  getClubAnalytics: (clubId: string) =>
    api.get<{ success: boolean; data: ClubAnalyticsRaw }>(`/clubs/${clubId}/analytics`),
};