// components/profile/BadgesShowcase.tsx
// Renders earned badges (full color) and locked badges (greyed out with progress).

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../../utils';
import { Modal } from '../ui';
import type { EarnedBadge, LockedBadge } from '../../types/phase3';

const TIER_STYLES: Record<string, { ring: string; glow: string; label: string }> = {
  bronze:   { ring: 'ring-amber-400',   glow: 'shadow-amber-100',  label: 'Bronze'   },
  silver:   { ring: 'ring-gray-400',    glow: 'shadow-gray-100',   label: 'Silver'   },
  gold:     { ring: 'ring-yellow-400',  glow: 'shadow-yellow-100', label: 'Gold'     },
  platinum: { ring: 'ring-indigo-400',  glow: 'shadow-indigo-100', label: 'Platinum' },
};

// ── Single earned badge pill ──────────────────────────────────────────────────
const EarnedBadgePill: React.FC<{ badge: EarnedBadge; onClick: () => void }> = ({ badge, onClick }) => {
  const tier = TIER_STYLES[badge.tier];
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-gray-100',
        'hover:shadow-md transition-all duration-200 cursor-pointer group',
        'ring-2', tier.ring, tier.glow, 'shadow-sm'
      )}
    >
      <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
        {badge.icon}
      </span>
      <span className="text-[11px] font-bold text-gray-700 text-center leading-tight max-w-18">
        {badge.name}
      </span>
      <span className={cn(
        'px-2 py-0.5 rounded-full text-[10px] font-semibold',
        badge.tier === 'bronze'   ? 'bg-amber-100 text-amber-700' :
        badge.tier === 'silver'   ? 'bg-gray-100 text-gray-600' :
        badge.tier === 'gold'     ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-indigo-100 text-indigo-700'
      )}>
        {tier.label}
      </span>
    </button>
  );
};

// ── Single locked badge pill ──────────────────────────────────────────────────
const LockedBadgePill: React.FC<{ badge: LockedBadge; onClick: () => void }> = ({ badge, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-200 cursor-pointer group relative"
  >
    <span className="text-3xl opacity-30 grayscale">{badge.icon}</span>
    <span className="text-[11px] font-semibold text-gray-400 text-center leading-tight max-w-18">
      {badge.name}
    </span>
    {/* Progress bar */}
    <div className="w-full bg-gray-200 rounded-full h-1 mt-0.5 overflow-hidden">
      <div
        className="h-full bg-indigo-400 rounded-full transition-all duration-700"
        style={{ width: `${badge.progress}%` }}
      />
    </div>
    <span className="text-[10px] text-gray-400">{badge.progressLabel}</span>
    {/* Lock icon */}
    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
      <Lock size={9} className="text-gray-400" />
    </div>
  </button>
);

// ── Badge detail modal ────────────────────────────────────────────────────────
interface BadgeDetailModalProps {
  badge: EarnedBadge | LockedBadge | null;
  onClose: () => void;
}

const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({ badge, onClose }) => {
  if (!badge) return null;
  const earned = 'earnedAt' in badge;
  return (
    <Modal open={!!badge} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-3">
        <span className="text-6xl">{badge.icon}</span>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{badge.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
          {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)} Tier
        </div>
        {earned ? (
          <p className="text-xs text-emerald-600 font-medium">
            ✅ Earned {new Date((badge as EarnedBadge).earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        ) : (
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{(badge as LockedBadge).progressLabel}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(badge as LockedBadge).progress}%` }}
              />
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 italic">"{badge.unlockCondition}"</p>
      </div>
    </Modal>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
interface BadgesShowcaseProps {
  earned: EarnedBadge[];
  locked: LockedBadge[];
}

const BadgesShowcase: React.FC<BadgesShowcaseProps> = ({ earned, locked }) => {
  const [selected, setSelected] = useState<EarnedBadge | LockedBadge | null>(null);

  return (
    <div className="space-y-5">
      {/* Earned */}
      {earned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Earned · {earned.length}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {earned.map((b) => (
              <EarnedBadgePill key={b.id} badge={b} onClick={() => setSelected(b)} />
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            In Progress · {locked.length}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {locked.map((b) => (
              <LockedBadgePill key={b.type} badge={b} onClick={() => setSelected(b)} />
            ))}
          </div>
        </div>
      )}

      <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default BadgesShowcase;
