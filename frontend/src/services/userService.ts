import api from './api';
import type { ApiResponse, DashboardData, StudentStats, Achievement, Notification } from '../types';

export const userService = {
  getDashboard: () =>
    api.get<ApiResponse<DashboardData>>('/users/me/dashboard'),

  getStats: () =>
    api.get<ApiResponse<StudentStats>>('/users/me/stats'),

  getAchievements: () =>
    api.get<ApiResponse<Achievement>>('/users/me/achievements'),

  getNotifications: () =>
    api.get<ApiResponse<Notification[]>>('/notifications'),

  markNotificationRead: (id: string) =>
    api.put<ApiResponse<null>>(`/notifications/${id}/read`),

  getAdminAnalytics: () =>
    api.get<ApiResponse<unknown>>('/admin/analytics'),
};
