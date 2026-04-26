import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '../../utils';
import type { RankingTier } from '../../types/phase2';

interface RankingBadgeProps {
  tier: RankingTier;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const tierConfig: Record<RankingTier, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  gold: {
    label: 'Gold',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    icon: <Trophy size={14} />,
  },
  silver: {
    label: 'Silver',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-300',
    icon: <Medal size={14} />,
  },
  bronze: {
    label: 'Bronze',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-300',
    icon: <Award size={14} />,
  },
  unranked: {
    label: 'Unranked',
    bg: 'bg-gray-100',
    text: 'text-gray-400',
    border: 'border-gray-200',
    icon: null,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

export const RankingBadge: React.FC<RankingBadgeProps> = ({
  tier,
  rank,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const config = tierConfig[tier];
  if (tier === 'unranked' && !showLabel) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className,
      )}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
      {rank !== undefined && tier !== 'unranked' && (
        <span className="opacity-70">#{rank}</span>
      )}
    </span>
  );
};

// ─── Ranking trend arrow ─────────────────────────────────────────────────────

interface RankTrendProps {
  current: number;
  previous?: number;
}

export const RankTrend: React.FC<RankTrendProps> = ({ current, previous }) => {
  if (previous === undefined) return null;
  const diff = previous - current; // positive = went up in rank (rank # decreased)
  if (diff === 0) return <span className="text-gray-400 text-xs">→ same</span>;
  if (diff > 0)
    return <span className="text-green-500 text-xs font-medium">↑ {diff}</span>;
  return <span className="text-red-400 text-xs font-medium">↓ {Math.abs(diff)}</span>;
};
