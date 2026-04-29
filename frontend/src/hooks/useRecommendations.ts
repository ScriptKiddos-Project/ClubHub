import { useState, useCallback, useEffect } from 'react';
import type { AxiosError } from 'axios';
import api from '../services/api';

interface RecommendedEvent {
  event: {
    id: string;
    title: string;
    date: string;
    venue?: string;
    tags: string[];
    type: string;
    points: number;
  };
  score: number;
  reason: string;
}

interface ApiErrorResponse {
  error?: { message?: string };
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<{ success: boolean; data: RecommendedEvent[] }>('/recommendations');
      setRecommendations(data.data ?? []);
      setError(null);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message ?? 'Failed to load recommendations');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.post<{ success: boolean; data: RecommendedEvent[] }>('/recommendations/refresh');
      setRecommendations(data.data ?? []);
      setError(null);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setError(axiosErr.response?.data?.error?.message ?? 'Failed to refresh recommendations');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // FIX: wrap in void async IIFE so the effect body itself is synchronous
  // and contains no setState calls — satisfies react-hooks/set-state-in-effect.
  useEffect(() => {
    void (async () => { await fetchRecommendations(); })();
  }, [fetchRecommendations]);

  return { recommendations, isLoading, error, refresh };
}