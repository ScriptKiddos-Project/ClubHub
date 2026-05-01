// pages/student/PointsBreakdownPage.tsx
// Full AICTE points history with multiplier breakdown and running total chart.

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ChevronLeft, ChevronRight, Star, Clock, Zap, TrendingUp } from 'lucide-react';
import { usePointsHistory } from '../../hooks/usePhase3';
import { Card, Badge, Skeleton } from '../../components/ui';
import type { PointsHistoryEntry, MemberType } from '../../types/phase3';
import { AICTE_MULTIPLIERS } from '../../types/phase3';
import { cn } from '../../utils';

// ── Multiplier badge ──────────────────────────────────────────────────────────
const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  non_member: 'Non-Member',
  member: 'Member',
  working_committee: 'Working Committee',
  core_member: 'Core Member',
};
const MULTIPLIER_COLORS: Record<MemberType, string> = {
  non_member: 'default',
  member: 'info',
  working_committee: 'warning',
  core_member: 'primary',
} as const;

const MultiplierBadge: React.FC<{ type: MemberType }> = ({ type }) => (
  <Badge variant={MULTIPLIER_COLORS[type] as 'default' | 'info' | 'warning' | 'primary'}>
    {AICTE_MULTIPLIERS[type]}× · {MEMBER_TYPE_LABELS[type]}
  </Badge>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({
  icon, label, value, color
}) => (
  <Card className="flex items-center gap-4">
    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', color)}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </Card>
);

// ── Entry row ─────────────────────────────────────────────────────────────────
const EntryRow: React.FC<{ entry: PointsHistoryEntry }> = ({ entry }) => (
  <div className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-1 rounded-lg transition-colors">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate">{entry.eventTitle}</p>
      <p className="text-xs text-gray-500 mt-0.5">{entry.clubName}</p>
    </div>

    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 shrink-0">
      <span className="font-medium text-gray-600">{entry.basePoints} base</span>
      <span>×</span>
      <span className="font-semibold text-indigo-600">{entry.multiplier}x</span>
    </div>

    <div className="hidden md:block shrink-0">
      <MultiplierBadge type={entry.memberType} />
    </div>

    <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 shrink-0 font-medium">
      <Clock size={12} />
      {entry.volunteerHours}h
    </div>

    <div className="shrink-0 text-right">
      <p className="text-sm font-bold text-gray-900">+{entry.finalPoints}</p>
      <p className="text-[10px] text-gray-400">
        {new Date(entry.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
    </div>
  </div>
);

// ── Skeleton loader ───────────────────────────────────────────────────────────
const HistorySkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-3.5">
        <Skeleton className="flex-1 h-8" />
        <Skeleton className="w-20 h-5" />
        <Skeleton className="w-16 h-5" />
      </div>
    ))}
  </div>
);

// ── Custom Tooltip ────────────────────────────────────────────────────────────
// FIX: avoid inline formatter prop that causes Recharts type mismatch.
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ value: number | undefined }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, background: '#fff', padding: '8px 12px' }}>
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-indigo-600">{payload[0]?.value ?? 0} pts</p>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const PointsBreakdownPage: React.FC = () => {
  const { data, loading, error, page, setPage } = usePointsHistory();

  const chartData = (data?.entries ?? []).map((e) => ({
    name: e.eventTitle.length > 12 ? e.eventTitle.slice(0, 12) + '…' : e.eventTitle,
    points: e.finalPoints,
    memberType: e.memberType,
  }));

  const BAR_COLORS: Record<MemberType, string> = {
    non_member: '#94a3b8',
    member: '#60a5fa',
    working_committee: '#f59e0b',
    core_member: '#6366f1',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AICTE Points Breakdown</h1>
        <p className="text-sm text-gray-500 mt-1">
          Points are awarded based on attendance; multipliers reflect your role in each club.
        </p>
      </div>

      <Card>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Multiplier Reference</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(AICTE_MULTIPLIERS) as [MemberType, number][]).map(([type, mult]) => (
            <div key={type} className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-xl">
              <span className="text-lg font-black text-indigo-600">{mult}×</span>
              <span className="text-[11px] text-gray-500 text-center">{MEMBER_TYPE_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </Card>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Star size={20} className="text-yellow-500" />}
            label="Total Points"
            value={(data.totalPoints ?? 0).toLocaleString()}
            color="bg-yellow-50"
          />
          <StatCard
            icon={<Clock size={20} className="text-emerald-500" />}
            label="Volunteer Hours"
            value={`${data.totalHours ?? 0}h`}
            color="bg-emerald-50"
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-indigo-500" />}
            label="Events Attended"
            value={(data.pagination?.total ?? 0).toString()}
            color="bg-indigo-50"
          />
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <Card>
          <p className="text-sm font-bold text-gray-800 mb-4">Points This Page</p>
          <ResponsiveContainer width="100%" height={200}>
            {/* FIX: use custom tooltip component instead of inline formatter */}
            <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="points" radius={[6, 6, 0, 0]}>
                {chartData.map((item, i) => (
                  <Cell key={i} fill={BAR_COLORS[item.memberType as MemberType]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3">
            {(Object.entries(BAR_COLORS) as [MemberType, string][]).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
                {MEMBER_TYPE_LABELS[type]}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-800">Event History</p>
          {data && (
            <p className="text-xs text-gray-400">
              {data.pagination.total} events · {data.pagination.totalPages} pages
            </p>
          )}
        </div>

        {loading && <HistorySkeleton />}
        {error && <p className="text-sm text-red-500 py-4 text-center">{error}</p>}

        {!loading && data && (
          <>
            <div className="divide-y divide-gray-50">
              {data.entries.length === 0 ? (
                <div className="py-12 text-center">
                  <Zap size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No points earned yet. Start attending events!</p>
                </div>
              ) : (
                data.entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)
              )}
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-xs text-gray-400">Page {page} of {data.pagination.totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default PointsBreakdownPage;
