import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import {
  analyticsService,
  type GlobalAnalytics,
  type ClubAnalytics,
  type ClubAnalyticsRaw,
} from '../services/analyticsService';
import type { StudentStats } from '../types';

// ─── Student — uses existing userService (already normalised) ─────────────────
export const useStudentStats = () => {
  const [data, setData]       = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    userService
      .getStats()
      .then((res) => setData(res.data.data as StudentStats))
      .catch(() => setError('Failed to load your analytics'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};

// ─── Admin / global ───────────────────────────────────────────────────────────
export const useGlobalAnalytics = () => {
  const [data, setData]       = useState<GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    analyticsService
      .getGlobalAnalytics()
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load platform analytics'))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
};

// ─── Club ─────────────────────────────────────────────────────────────────────
// Reshapes the raw Prisma groupBy output into { month, count } pairs for the chart.
// Backend returns memberGrowth as: [{ joined_at: ISO string, _count: { user_id: N } }]
const reshapeMemberGrowth = (
  raw: ClubAnalyticsRaw['memberGrowth'],
): { month: string; count: number }[] => {
  // Group by "Mon YYYY" label
  const map = new Map<string, number>();
  for (const row of raw) {
    const d = new Date(row.joined_at);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    map.set(label, (map.get(label) ?? 0) + (row._count?.user_id ?? 1));
  }
  return Array.from(map.entries()).map(([month, count]) => ({ month, count }));
};

export const useClubAnalytics = (clubId: string) => {
  const [data, setData]       = useState<ClubAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    analyticsService
      .getClubAnalytics(clubId)
      .then((res) => {
        const raw = res.data.data;
        setData({
          totalMembers: raw.memberCount,          // backend: memberCount
          totalEvents: raw.totalEvents,           // backend: totalEvents
          attendanceRate: raw.attendanceRate,     // backend: attendanceRate
          memberCountOverTime: reshapeMemberGrowth(raw.memberGrowth ?? []),
          events: raw.events ?? [],
        });
      })
      .catch(() => setError('Failed to load club analytics'))
      .finally(() => setLoading(false));
  }, [clubId]);

  return { data, loading, error };
};