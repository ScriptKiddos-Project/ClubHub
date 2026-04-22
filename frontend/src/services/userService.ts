import api from './api';
import type { ApiResponse, DashboardData, StudentStats, Achievement, Notification } from '../types';
import {
  normalizeDashboard,
  normalizeNotification,
  normalizeStudentStats,
} from './normalizers';

export const userService = {
  getDashboard: () =>
    api.get<ApiResponse<DashboardData>>('/users/me/dashboard').then((response) => ({
      ...response,
      data: {
        ...response.data,
        data: normalizeDashboard(response.data.data),
      },
    })),

  getStats: () =>
    api.get<ApiResponse<StudentStats>>('/users/me/stats').then((response) => ({
      ...response,
      data: {
        ...response.data,
        data: normalizeStudentStats(response.data.data),
      },
    })),

  getAchievements: () =>
    api.get<ApiResponse<Achievement>>('/users/me/achievements'),

  getNotifications: () =>
    api.get('/notifications').then((response) => ({
      ...response,
      data: {
        success: true,
        data: (Array.isArray(response.data.data?.notifications) ? response.data.data.notifications : []).map(normalizeNotification),
      } satisfies ApiResponse<Notification[]>,
    })),

  markNotificationRead: (id: string) =>
    api.put<ApiResponse<null>>(`/notifications/${id}/read`),

  getAdminAnalytics: () =>
    api.get<ApiResponse<unknown>>('/admin/analytics'),
};
