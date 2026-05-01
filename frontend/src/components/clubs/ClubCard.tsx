import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar } from 'lucide-react';
import { cn, categoryColor } from '../../utils';
import { Button } from '../ui/Button';
import { RankingBadge } from '../rankings/RankingBadge';
import type { Club } from '../../types';

const categoryLabel: Record<string, string> = {
  technology: 'Technology',
  arts_culture: 'Arts & Culture',
  sports: 'Sports',
  academic: 'Academic',
  social: 'Social',
  career_prep: 'Career Prep',
  development: 'Development',
  creative_arts: 'Creative Arts',
  technical: 'Technical',
  cultural: 'Cultural',
  entrepreneurship: 'Entrepreneurship',
  arts: 'Arts',
  volunteer: 'Volunteer',
  other: 'Other',
};

interface ClubCardProps {
  club: Club;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
      {/* Banner */}
      <div className="relative h-28 bg-linear-to-br from-indigo-500 to-purple-600 overflow-hidden">
        {club.bannerUrl && (
          <img
            src={club.bannerUrl}
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
        <span
          className={cn(
            'absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold',
            categoryColor(club.category),
          )}
        >
          {categoryLabel[club.category] || club.category}
        </span>

        {club.rankingTier && club.rankingTier !== 'unranked' && (
          <div className="absolute top-3 left-3">
            <RankingBadge tier={club.rankingTier} size="sm" showLabel={false} />
          </div>
        )}
      </div>

      {/* Logo + info */}
      <div className="px-4 pt-3 pb-4 -mt-4 relative">
        <div className="w-12 h-12 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-lg mb-2">
          {club.logoUrl
            ? <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
            : club.name[0]}
        </div>

        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => navigate(`/clubs/${club.id}`)}
            className="text-left"
          >
            <h3 className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors">
              {club.name}
            </h3>
          </button>
          {club.rankingRank && (
            <span className="text-xs font-bold text-gray-400 shrink-0">
              #{club.rankingRank}
            </span>
          )}
        </div>

        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{club.description}</p>

        <div className="flex items-center gap-3 mt-3 text-gray-500 text-xs">
          <span className="flex items-center gap-1">
            <Users size={12} />{club.memberCount} members
          </span>
          {club.upcomingEventCount !== undefined && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />{club.upcomingEventCount} events
            </span>
          )}
          {club.rankingScore !== undefined && club.rankingScore > 0 && (
            <span className="ml-auto text-indigo-500 font-semibold tabular-nums">
              {club.rankingScore.toFixed(1)}pts
            </span>
          )}
        </div>

        <div className="mt-3">
          {club.isJoined ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/clubs/${club.id}/analytics`)}
            >
              View Analytics
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => navigate(`/clubs/${club.id}`)}
            >
              Know More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};