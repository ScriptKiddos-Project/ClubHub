import api from './api';
import type { Club, ApiResponse, PaginatedResponse } from '../types';
import { mapClubCategoryToApi, normalizeClub } from './normalizers';

export const clubService = {
  list: async (params?: { page?: number; limit?: number; category?: string }) => {
    const response = await api.get('/clubs', {
      params: {
        ...params,
        category: mapClubCategoryToApi(params?.category),
      },
    });
    const items = Array.isArray(response.data.data) ? response.data.data.map(normalizeClub) : [];
    const meta = response.data.meta ?? {};
    const page = Number(meta.page ?? params?.page ?? 1);
    const limit = Number(meta.limit ?? params?.limit ?? Math.max(items.length, 1));
    const total = Number(meta.total ?? items.length);

    return {
      ...response,
      data: {
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / Math.max(limit, 1))),
        },
      } satisfies PaginatedResponse<Club>,
    };
  },

  get: async (id: string) => {
    const response = await api.get<ApiResponse<Club>>(`/clubs/${id}`);
    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeClub(response.data.data),
      },
    };
  },

  create: (data: Partial<Club>) =>
    api.post<ApiResponse<Club>>('/clubs', data),

  join: (id: string) =>
    api.post<ApiResponse<null>>(`/clubs/${id}/join`),

  leave: (id: string) =>
    api.delete<ApiResponse<null>>(`/clubs/${id}/leave`),

  getAnalytics: (id: string) =>
    api.get<ApiResponse<unknown>>(`/clubs/${id}/analytics`),

  // Admin
  getPending: async () => {
    const response = await api.get('/admin/clubs/pending');
    const items = Array.isArray(response.data.data) ? response.data.data.map(normalizeClub) : [];

    return {
      ...response,
      data: {
        success: true,
        data: items,
        pagination: {
          page: 1,
          limit: Math.max(items.length, 1),
          total: Number(response.data.meta?.total ?? items.length),
          totalPages: 1,
        },
      } satisfies PaginatedResponse<Club>,
    };
  },

  approve: (id: string, data: { approved: boolean; reason?: string }) =>
    api.put<ApiResponse<Club>>(`/admin/clubs/${id}/approve`, data),
};
