import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types';
import type { FeaturedEvent, EventFilters } from '../types/phase2';

export const featuredEventService = {
  /** GET /api/v1/events/featured — events sorted by engagement score */
  getFeatured: (limit = 6) =>
    api.get<ApiResponse<FeaturedEvent[]>>('/events/featured', { params: { limit } }),

  /** GET /api/v1/events — advanced filtering with tags / skillAreas / hours */
  listAdvanced: (filters: EventFilters) =>
    api.get<PaginatedResponse<FeaturedEvent>>('/events', {
      params: {
        ...filters,
        tags: filters.tags?.join(','),
        skillAreas: filters.skillAreas?.join(','),
      },
    }),
};
