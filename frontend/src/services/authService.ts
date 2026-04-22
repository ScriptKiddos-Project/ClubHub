import api from './api';
import type {
  LoginPayload, RegisterPayload, ForgotPasswordPayload,
  ResetPasswordPayload, CoreJoinPayload, User, ApiResponse
} from '../types';
import { normalizeUser } from './normalizers';

export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', payload);
    return {
      ...response,
      data: {
        ...response.data,
        data: {
          ...response.data.data,
          user: normalizeUser(response.data.data.user),
        },
      },
    };
  },

  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<{ message: string }>>('/auth/register', {
      ...payload,
      enrollment_year: payload.enrollmentYear,
      degree_type: payload.degreeType,
    }),

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

  coreJoin: async (payload: CoreJoinPayload) => {
    const response = await api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/core-join', {
      name: payload.name,
      email: payload.email,
      club_id: payload.clubId,
      access_code: payload.accessCode,
    });
    return {
      ...response,
      data: {
        ...response.data,
        data: {
          ...response.data.data,
          user: normalizeUser(response.data.data.user),
        },
      },
    };
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeUser(response.data.data),
      },
    };
  },
};
