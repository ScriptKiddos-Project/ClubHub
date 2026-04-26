import React from 'react';
import {
  BarChart2, Users, Star, MessageCircle, Globe, X, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '../../utils';
import { RankingBadge, RankTrend } from './RankingBadge';
import type { RankingBreakdown, ClubRankingHistory } from '../../types/phase2';

interface RankingBreakdownModalProps {
  open: boolean;
  onClose: () => void;
  breakdown: RankingBreakdown | null;
  history: ClubRankingHistory[];
  clubName: string;
  loading?: boolean;
}

interface ScoreRowProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  weight: string;
  color: string;
}

const ScoreRow: React.FC<ScoreRowProps> = ({ label, icon, value, weight, color }) => (
  <div className="flex items-center gap-3">
    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400 ml-2">{weight}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-700"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
    <span className="text-sm font-bold text-gray-900 w-10 text-right">
      {value.toFixed(0)}
    </span>
  </div>
);

export const RankingBreakdownModal: React.FC<RankingBreakdownModalProps> = ({
  open,
  onClose,
  breakdown,
  history,
  clubName,
  loading,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Ranking Breakdown</h2>
            <p className="text-xs text-gray-500">{clubName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {loading || !breakdown ? (
          <div className="py-16 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Overall score */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-4xl font-extrabold text-indigo-600 tabular-nums">
                  {breakdown.totalScore.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Overall Score / 100</div>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <RankingBadge tier={breakdown.tier} rank={breakdown.rank} size="lg" />
                <RankTrend current={breakdown.rank} previous={breakdown.previousRank} />
              </div>
            </div>

            {/* Score breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BarChart2 size={14} className="text-indigo-500" />
                Score Components
              </h3>
              <ScoreRow
                label="Attendance Rate"
                icon={<Users size={14} className="text-blue-600" />}
                value={breakdown.attendanceRate}
                weight="30%"
                color="bg-blue-50"
              />
              <ScoreRow
                label="Events Held"
                icon={<TrendingUp size={14} className="text-green-600" />}
                value={breakdown.eventsHeld}
                weight="25%"
                color="bg-green-50"
              />
              <ScoreRow
                label="Member Engagement"
                icon={<Users size={14} className="text-purple-600" />}
                value={breakdown.memberEngagement}
                weight="20%"
                color="bg-purple-50"
              />
              <ScoreRow
                label="Feedback Score"
                icon={<Star size={14} className="text-yellow-600" />}
                value={breakdown.feedbackScore}
                weight="15%"
                color="bg-yellow-50"
              />
              <ScoreRow
                label="Social Activity"
                icon={<Globe size={14} className="text-rose-600" />}
                value={breakdown.socialActivity}
                weight="10%"
                color="bg-rose-50"
              />
            </div>

            {/* History chart */}
            {history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <MessageCircle size={14} className="text-indigo-500" />
                  Score History
                </h3>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                        formatter={(value) => {
                          const raw = Array.isArray(value) ? value[0] : value;
                          const numeric = typeof raw === 'number' ? raw : Number(raw ?? 0);
                          return [numeric.toFixed(1), 'Score'] as [string, string];
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#rankGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Updated: {new Date(breakdown.updatedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
