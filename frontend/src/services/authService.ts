import api from './api';
import type {
  LoginPayload, RegisterPayload, ForgotPasswordPayload,
  ResetPasswordPayload, CoreJoinPayload, User, ApiResponse
} from '../types';

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<{ message: string }>>('/auth/register', payload),

  verifyEmail: (token: string) =>
    api.get<ApiResponse<{ message: string }>>(`/auth/verify-email?token=${token}`),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<ApiResponse<{ message: string }>>('/auth/reset-password', payload),

  coreJoin: (payload: CoreJoinPayload) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/core-join', payload),

  getMe: () =>
    api.get<ApiResponse<User>>('/users/me'),
};
