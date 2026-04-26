import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { Suggestion, CreateSuggestionPayload, SuggestionStatus } from '../types/phase2';

export const suggestionService = {
  /** POST /api/v1/clubs/:id/suggestions */
  create: (clubId: string, payload: Omit<CreateSuggestionPayload, 'clubId'>) =>
    api.post<ApiResponse<Suggestion>>(`/clubs/${clubId}/suggestions`, payload),

  /** GET /api/v1/clubs/:id/suggestions */
  list: (clubId: string, params?: { page?: number; limit?: number; status?: SuggestionStatus }) =>
    api.get<PaginatedResponse<Suggestion>>(`/clubs/${clubId}/suggestions`, { params }),

  /** PATCH /api/v1/clubs/:id/suggestions/:suggestionId — admin status update */
  updateStatus: (
    clubId: string,
    suggestionId: string,
    data: { status: SuggestionStatus; adminNote?: string },
  ) =>
    api.patch<ApiResponse<Suggestion>>(
      `/clubs/${clubId}/suggestions/${suggestionId}`,
      data,
    ),
};
