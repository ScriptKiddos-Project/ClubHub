// frontend/src/services/adminService.ts
// Super Admin API calls — users, communities, announcements, club management.

import api from './api';
import type { ApiResponse, Club } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id:              string;
  name:            string;
  email:           string;
  role:            string;
  department:      string | null;
  enrollment_year: number | null;
  total_points:    number;   // ← was: points?: number  (backend field is total_points)
  is_verified:     boolean;
  created_at:      string;   // ← was: createdAt: string  (backend field is created_at)
}

export interface CommunityItem {
  id:           string;
  club_id:      string;
  club_name:    string;
  name:         string;
  tenure_start: string;
  tenure_end:   string;
  codes:        CodeSummary[];
  created_at:   string;
}

export interface CodeSummary {
  id:            string;
  assigned_role: string;
  is_revoked:    boolean;
  usage_count:   number;
  created_at:    string;
}

export interface CodeUsageEntry {
  id:         string;
  user_name:  string;
  user_email: string;
  used_at:    string;
}

export interface GlobalAnalytics {
  totalUsers:       number;
  totalClubs:       number;
  totalEvents:      number;
  avgAttendance:    number;
  newUsersThisWeek?: number;
  pendingClubs?:    number;
}

export interface AnnouncementItem {
  id:        string;
  title:     string;
  body:      string;
  createdAt: string;
  clubId?:   string;
  clubName?: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const adminService = {
  // GET /api/v1/admin/users
  listUsers: () =>
    api.get<ApiResponse<AdminUser[]>>('/admin/users'),

  // PATCH /api/v1/admin/users/:id/role
  changeUserRole: (userId: string, role: string) =>
    api.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/role`, { role }),

  // ─── Clubs ──────────────────────────────────────────────────────────────────

  // GET /api/v1/admin/clubs  (all clubs, not just pending)
  listAllClubs: () =>
    api.get<ApiResponse<Club[]>>('/admin/clubs'),

  // PUT /api/v1/admin/clubs/:id
  updateClub: (id: string, data: Partial<Club>) =>
    api.put<ApiResponse<Club>>(`/admin/clubs/${id}`, data),

  // POST /api/v1/clubs  (create — super admin bypasses approval)
  createClub: (data: Partial<Club>) =>
    api.post<ApiResponse<Club>>('/clubs', data),

  // ─── Analytics ──────────────────────────────────────────────────────────────

  // GET /api/v1/admin/analytics
  getGlobalAnalytics: () =>
    api.get<ApiResponse<GlobalAnalytics>>('/admin/analytics'),

  // ─── Communities & Access Codes ─────────────────────────────────────────────

  // GET /api/v1/admin/communities
  listCommunities: () =>
    api.get<ApiResponse<CommunityItem[]>>('/admin/communities'),

  // POST /api/v1/admin/communities
  createCommunity: (data: {
    club_id:      string;
    name:         string;
    tenure_start: string;
    tenure_end:   string;
  }) => api.post<ApiResponse<CommunityItem>>('/admin/communities', data),

  // POST /api/v1/admin/communities/:id/generate-code
  generateCode: (communityId: string, assigned_role: string) =>
    api.post<ApiResponse<{ plaintext: string; codeId: string }>>(
      `/admin/communities/${communityId}/generate-code`,
      { assigned_role }
    ),

  // PUT /api/v1/admin/communities/:id/revoke-code
  revokeCode: (codeId: string) =>
    api.put<ApiResponse<{ id: string; is_revoked: boolean }>>(
      `/admin/communities/${codeId}/revoke-code`
    ),

  // GET /api/v1/admin/communities/:id/code-usage
  getCodeUsage: (codeId: string) =>
    api.get<ApiResponse<CodeUsageEntry[]>>(`/admin/communities/${codeId}/code-usage`),

  // ─── Announcements ──────────────────────────────────────────────────────────

  // POST /api/v1/admin/announcements
  broadcastAnnouncement: (data: { title: string; body: string; club_id?: string }) =>
    api.post<ApiResponse<AnnouncementItem>>('/admin/announcements', data),

  // GET /api/v1/admin/announcements
  listAnnouncements: () =>
    api.get<ApiResponse<AnnouncementItem[]>>('/admin/announcements'),
};