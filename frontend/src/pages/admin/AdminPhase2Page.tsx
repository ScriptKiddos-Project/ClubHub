import React, { useState } from 'react';
import { Trophy, RefreshCw, BarChart2, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { useLeaderboard } from '../../hooks/usePhase2';
import { RankingBadge } from '../../components/rankings/RankingBadge';
import { cn } from '../../utils';
import api from '../../services/api';
import toast from 'react-hot-toast';
import type { RankedClub } from '../../types/phase2';

// ─── Manual ranking trigger ───────────────────────────────────────────────────
const ManualRankingTrigger: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const trigger = async () => {
    if (running) return;
    setRunning(true);
    try {
      await api.post('/admin/run-ranking-job');
      setLastRun(new Date().toLocaleTimeString());
      toast.success('Ranking job completed successfully');
    } catch {
      toast.error('Ranking job failed — check server logs');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={16} className="text-indigo-500" />
            Ranking Engine
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Rankings run automatically every night at 00:05. You can also trigger a manual recalculation here.
          </p>
          {lastRun && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={11} /> Last manual run: {lastRun}
            </p>
          )}
        </div>
        <button
          onClick={trigger}
          disabled={running}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0',
            running ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700',
          )}
        >
          <RefreshCw size={14} className={running ? 'animate-spin' : ''} />
          {running ? 'Running…' : 'Run Now'}
        </button>
      </div>
    </div>
  );
};

// ─── Tier distribution summary ────────────────────────────────────────────────
const TierDistribution: React.FC<{ clubs: RankedClub[] }> = ({ clubs }) => {
  const counts = {
    gold:     clubs.filter((c) => c.tier === 'gold').length,
    silver:   clubs.filter((c) => c.tier === 'silver').length,
    bronze:   clubs.filter((c) => c.tier === 'bronze').length,
    unranked: clubs.filter((c) => c.tier === 'unranked').length,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(
        [
          { label: '🥇 Gold',    count: counts.gold,     bg: 'bg-yellow-50 border-yellow-200' },
          { label: '🥈 Silver',  count: counts.silver,   bg: 'bg-gray-50  border-gray-200'   },
          { label: '🥉 Bronze',  count: counts.bronze,   bg: 'bg-orange-50 border-orange-200' },
          { label: '— Unranked', count: counts.unranked, bg: 'bg-gray-50  border-gray-100'   },
        ] as const
      ).map(({ label, count, bg }) => (
        <div key={label} className={cn('rounded-xl border p-4 text-center', bg)}>
          <div className="text-2xl font-black text-gray-800">{count}</div>
          <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── Main admin phase2 page ───────────────────────────────────────────────────
const AdminPhase2Page: React.FC = () => {
  const { clubs, loading } = useLeaderboard();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Trophy size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phase 2 Admin Panel</h1>
          <p className="text-gray-500 text-sm">Rankings · Suggestions · Featured Events</p>
        </div>
      </div>

      <ManualRankingTrigger />

      {!loading && clubs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            Tier Distribution
          </h2>
          <TierDistribution clubs={clubs} />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 size={16} className="text-indigo-500" />
          Current Leaderboard
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Rank', 'Club', 'Members', 'Score', 'Tier'].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider${h === 'Members' ? ' hidden sm:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clubs.map((club) => (
                  <tr key={club.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-black text-gray-400">#{club.rank}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-gray-100 overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {club.logoUrl
                            ? <img src={club.logoUrl} alt="" className="w-full h-full object-cover" />
                            : club.name[0]}
                        </div>
                        {/* FIX: use max-w-40 (Tailwind canonical) instead of max-w-[160px] */}
                        <span className="font-semibold text-gray-800 truncate max-w-40">{club.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{club.memberCount}</td>
                    <td className="px-5 py-3 font-bold text-indigo-600 tabular-nums">{club.rankingScore.toFixed(1)}</td>
                    <td className="px-5 py-3">
                      {/* FIX: club.tier is already typed as RankedClub['tier'] — no cast needed */}
                      <RankingBadge tier={club.tier} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
          <AlertTriangle size={14} /> Scoring Weights Reference
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Attendance Rate', weight: '30%' },
            { label: 'Events Held',     weight: '25%' },
            { label: 'Engagement',      weight: '20%' },
            { label: 'Feedback Score',  weight: '15%' },
            { label: 'Social Activity', weight: '10%' },
          ].map(({ label, weight }) => (
            <div key={label} className="bg-white rounded-xl p-3 text-center border border-indigo-100">
              <div className="text-base font-black text-indigo-600">{weight}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPhase2Page;