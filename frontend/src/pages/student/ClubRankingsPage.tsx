import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, TrendingUp, BarChart2, Search } from 'lucide-react';
import { useLeaderboard } from '../../hooks/usePhase2';
import { RankingBadge, RankTrend } from '../../components/rankings/RankingBadge';
import { RankingBreakdownModal } from '../../components/rankings/RankingBreakdownModal';
import { useClubRanking } from '../../hooks/usePhase2';
import { cn, categoryColor } from '../../utils';
import type { RankedClub } from '../../types/phase2';

const TIER_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All Clubs' },
  { value: 'gold', label: '🥇 Gold' },
  { value: 'silver', label: '🥈 Silver' },
  { value: 'bronze', label: '🥉 Bronze' },
];

// ─── Breakdown modal wrapper ──────────────────────────────────────────────────

const BreakdownModalWrapper: React.FC<{
  clubId: string;
  clubName: string;
  open: boolean;
  onClose: () => void;
}> = ({ clubId, clubName, open, onClose }) => {
  const { breakdown, history, loading } = useClubRanking(open ? clubId : '');
  return (
    <RankingBreakdownModal
      open={open}
      onClose={onClose}
      breakdown={breakdown}
      history={history}
      clubName={clubName}
      loading={loading}
    />
  );
};

// ─── Podium (top 3) ───────────────────────────────────────────────────────────

const Podium: React.FC<{ clubs: RankedClub[]; onBreakdown: (c: RankedClub) => void }> = ({
  clubs,
  onBreakdown,
}) => {
  const top3 = clubs.slice(0, 3);
  // visual order: 2nd, 1st, 3rd
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = ['h-24', 'h-32', 'h-20'];
  const crowns = ['🥈', '🥇', '🥉'];

  return (
    <div className="flex items-end justify-center gap-3 mb-8">
      {order.map((club, i) => {
        const isCenter = i === 1;
        return (
          <div key={club.id} className="flex flex-col items-center gap-2">
            {/* Crown */}
            <span className="text-2xl">{crowns[i]}</span>
            {/* Avatar */}
            <div
              className={cn(
                'w-14 h-14 rounded-2xl bg-white border-4 shadow-md overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-lg cursor-pointer hover:scale-105 transition-transform',
                isCenter ? 'border-yellow-400' : 'border-gray-200',
              )}
              onClick={() => onBreakdown(club)}
            >
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                club.name[0]
              )}
            </div>
            <p className="text-xs font-bold text-gray-800 text-center max-w-20 line-clamp-2">
              {club.name}
            </p>
            <RankingBadge tier={club.tier} rank={club.rank} size="sm" />
            {/* Podium bar */}
            <div
              className={cn(
                'w-20 rounded-t-xl flex items-start justify-center pt-2',
                heights[i],
                isCenter ? 'bg-yellow-400' : i === 0 ? 'bg-gray-300' : 'bg-amber-600',
              )}
            >
              <span className="text-white font-black text-lg">#{club.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const ClubRankingsPage: React.FC = () => {
  const [tierFilter, setTierFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState<RankedClub | null>(null);

  const { clubs, loading } = useLeaderboard();

  const filtered = clubs.filter((c) => {
    const matchTier = !tierFilter || c.tier === tierFilter;
    const matchSearch =
      !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchTier && matchSearch;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
          <Trophy size={20} className="text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Club Rankings</h1>
          <p className="text-gray-500 text-sm">Updated nightly · Weighted scoring system</p>
        </div>
      </div>

      {/* Scoring info banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4">
        <div className="flex items-start gap-3">
          <BarChart2 size={18} className="text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">How Rankings Work</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Scores are computed nightly: Attendance Rate (30%) + Events Held (25%) +
              Member Engagement (20%) + Feedback Score (15%) + Social Activity (10%).
              Click any club to see its detailed breakdown.
            </p>
          </div>
        </div>
      </div>

      {/* Podium — top 3 */}
      {!loading && filtered.length >= 3 && !search && !tierFilter && (
        <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <h2 className="text-base font-bold text-gray-900 text-center mb-6">
            🏆 Top Performers
          </h2>
          <Podium clubs={filtered} onBreakdown={setSelectedClub} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TIER_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTierFilter(value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                tierFilter === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p>No clubs match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((club, idx) => (
            <div
              key={club.id}
              className={cn(
                'flex items-center gap-4 bg-white rounded-2xl border px-5 py-4 hover:shadow-sm hover:border-indigo-200 transition-all',
                club.tier === 'gold' && idx < 3 ? 'border-yellow-200' : 'border-gray-100',
              )}
            >
              {/* Rank number */}
              <div className="w-8 text-center">
                <span
                  className={cn(
                    'text-lg font-black',
                    club.rank === 1
                      ? 'text-yellow-500'
                      : club.rank === 2
                      ? 'text-gray-400'
                      : club.rank === 3
                      ? 'text-amber-600'
                      : 'text-gray-300',
                  )}
                >
                  #{club.rank}
                </span>
              </div>

              {/* Club logo */}
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-gray-100 overflow-hidden flex items-center justify-center text-indigo-600 font-bold shrink-0">
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                ) : (
                  club.name[0]
                )}
              </div>

              {/* Name + category */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/clubs/${club.id}`}
                  className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {club.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      categoryColor(club.category),
                    )}
                  >
                    {club.category.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Users size={10} />{club.memberCount} members
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right hidden sm:block">
                <div className="text-lg font-black text-indigo-600 tabular-nums">
                  {club.rankingScore.toFixed(1)}
                </div>
                <div className="text-xs text-gray-400">score</div>
              </div>

              {/* Trend */}
              <div className="hidden md:flex items-center">
                <RankTrend current={club.rank} previous={club.previousRank} />
              </div>

              {/* Tier badge */}
              <RankingBadge tier={club.tier} size="sm" showLabel={false} />

              {/* Breakdown button */}
              <button
                onClick={() => setSelectedClub(club)}
                className="p-2 hover:bg-indigo-50 rounded-xl transition-colors text-indigo-500"
                title="View score breakdown"
              >
                <TrendingUp size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Breakdown modal */}
      {selectedClub && (
        <BreakdownModalWrapper
          clubId={selectedClub.id}
          clubName={selectedClub.name}
          open={!!selectedClub}
          onClose={() => setSelectedClub(null)}
        />
      )}
    </div>
  );
};

export default ClubRankingsPage;
