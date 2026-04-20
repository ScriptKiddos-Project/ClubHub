import api from './api';
import type { Club, ApiResponse, PaginatedResponse } from '../types';

export const clubService = {
  list: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get<PaginatedResponse<Club>>('/clubs', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Club>>(`/clubs/${id}`),

  create: (data: Partial<Club>) =>
    api.post<ApiResponse<Club>>('/clubs', data),

  join: (id: string) =>
    api.post<ApiResponse<null>>(`/clubs/${id}/join`),

  leave: (id: string) =>
    api.delete<ApiResponse<null>>(`/clubs/${id}/leave`),

  getAnalytics: (id: string) =>
    api.get<ApiResponse<unknown>>(`/clubs/${id}/analytics`),

  // Admin
  getPending: () =>
    api.get<PaginatedResponse<Club>>('/admin/clubs/pending'),

  approve: (id: string, data: { approved: boolean; reason?: string }) =>
    api.put<ApiResponse<Club>>(`/admin/clubs/${id}/approve`, data),
};
