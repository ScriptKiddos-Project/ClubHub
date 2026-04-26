import { useState, useEffect, useCallback } from 'react';
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

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<{ success: boolean; data: RecommendedEvent[] }>(
        '/recommendations'
      );
      setRecommendations(data.data ?? []); // ← null/undefined safe
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Failed to load recommendations');
      setRecommendations([]); // ← clear stale data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.post<{ success: boolean; data: RecommendedEvent[] }>(
        '/recommendations/refresh'
      );
      setRecommendations(data.data ?? []); // ← null/undefined safe
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Failed to refresh recommendations');
      setRecommendations([]); // ← clear stale data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, isLoading, error, refresh };
}