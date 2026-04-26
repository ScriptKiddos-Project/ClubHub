import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { rankingService } from '../services/rankingService';
import { suggestionService } from '../services/suggestionService';
import { featuredEventService } from '../services/featuredEventService';
import type { RankedClub, RankingBreakdown, ClubRankingHistory, Suggestion, SuggestionStatus, FeaturedEvent } from '../types/phase2';

// ─── useClubRanking ──────────────────────────────────────────────────────────

export const useClubRanking = (clubId: string) => {
  const [breakdown, setBreakdown] = useState<RankingBreakdown | null>(null);
  const [history, setHistory] = useState<ClubRankingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    Promise.all([
      rankingService.getBreakdown(clubId),
      rankingService.getHistory(clubId),
    ])
      .then(([breakdownRes, historyRes]) => {
        setBreakdown(breakdownRes.data.data);
        setHistory(historyRes.data.data);
      })
      .catch(() => setError('Failed to load ranking data'))
      .finally(() => setLoading(false));
  }, [clubId]);

  return { breakdown, history, loading, error };
};

// ─── useLeaderboard ──────────────────────────────────────────────────────────

export const useLeaderboard = () => {
  const [clubs, setClubs] = useState<RankedClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (tier?: string) => {
    setLoading(true);
    try {
      const res = await rankingService.getLeaderboard({ limit: 50, tier });
      setClubs(res.data.data);
    } catch {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { clubs, loading, error, refetch: fetch };
};

// ─── useSuggestions ──────────────────────────────────────────────────────────

export const useSuggestions = (clubId: string) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await suggestionService.list(clubId);
      setSuggestions(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => { if (clubId) refresh(); }, [clubId, refresh]);

  const submit = useCallback(async (title: string, body: string) => {
    try {
      const res = await suggestionService.create(clubId, { title, body });
      setSuggestions((prev) => [res.data.data, ...prev]);
      toast.success('Suggestion submitted!');
    } catch {
      toast.error('Failed to submit suggestion');
    }
  }, [clubId]);

  const updateStatus = useCallback(
    async (suggestionId: string, status: SuggestionStatus, adminNote?: string) => {
      try {
        const res = await suggestionService.updateStatus(clubId, suggestionId, { status, adminNote });
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestionId ? res.data.data : s)),
        );
        toast.success('Status updated');
      } catch {
        toast.error('Failed to update status');
      }
    },
    [clubId],
  );

  return { suggestions, loading, submit, updateStatus, refresh };
};

// ─── useFeaturedEvents ───────────────────────────────────────────────────────

export const useFeaturedEvents = (limit = 6) => {
  const [events, setEvents] = useState<FeaturedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    featuredEventService
      .getFeatured(limit)
      .then((res) => setEvents(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  return { events, loading };
};
