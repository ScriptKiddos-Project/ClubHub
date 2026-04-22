import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Bookmark, Zap, Flame, TrendingUp } from 'lucide-react';
import { formatDate, formatTime, truncate } from '../../utils';
import { Badge, AvatarGroup } from '../ui';

import type { Event } from '../../types';

interface EventCardProps {
  event: Event;
  onRegister?: (id: string) => void;
  onUnregister?: (id: string) => void;
  variant?: 'default' | 'compact' | 'featured';
}

const categoryLabel: Record<string, string> = {
  technology: 'Technology', arts_culture: 'Arts & Culture', sports: 'Sports',
  academic: 'Academic', social: 'Social', career_prep: 'Career Prep',
  development: 'Development', creative_arts: 'Creative Arts',
};

export const EventCard: React.FC<EventCardProps> = ({ event, variant = 'default', onRegister, onUnregister }) => {
  const spots = event.capacity - event.registrationCount;
  const pct = (event.registrationCount / event.capacity) * 100;

  if (variant === 'featured') {
    return (
      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        {/* Hero image */}
        <div className="relative h-48 bg-gradient-to-br from-indigo-900 to-purple-900 overflow-hidden">
          {event.heroImageUrl && (
            <img src={event.heroImageUrl} alt={event.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"/>
          )}
          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {event.isTrending && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-white/90 rounded-full text-xs font-bold text-gray-800">
                <TrendingUp size={10}/> TRENDING
              </span>
            )}
            {event.isHot && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 rounded-full text-xs font-bold text-white">
                <Flame size={10}/> HOT
              </span>
            )}
            {event.isLive && <Badge variant="danger" className="text-xs">LIVE</Badge>}
            {event.isPopular && <Badge variant="primary" className="text-xs">POPULAR</Badge>}
            {event.isLimited && <Badge variant="warning" className="text-xs">LIMITED</Badge>}
          </div>
          {/* Date badge */}
          <div className="absolute top-3 right-3 bg-white rounded-xl px-2.5 py-1.5 text-center shadow-sm">
            <p className="text-indigo-600 font-bold text-xs">{formatDate(event.date).split(' ')[0].toUpperCase()}</p>
            <p className="text-gray-900 font-bold text-lg leading-none">{formatDate(event.date).split(' ')[1].replace(',','')}</p>
          </div>
          {/* AI match score */}
          {event.aiMatchScore && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-indigo-600/90 rounded-full text-white text-xs font-bold">
              <Zap size={10}/> {event.aiMatchScore}% AI Match
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Category */}
          {event.club && (
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">
              {categoryLabel[event.club.category] || event.club.category}
            </p>
          )}
          <Link to={`/events/${event.id}`}>
            <h3 className="font-bold text-gray-900 text-sm leading-snug hover:text-indigo-600 transition-colors line-clamp-2">{event.title}</h3>
          </Link>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{truncate(event.description, 100)}</p>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <AvatarGroup users={[{name:'A'},{name:'B'},{name:'C'}]} max={3}/>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{event.registrationCount} Going</span>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-indigo-600">
                <Bookmark size={14}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact card for "Upcoming Today"
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-200">
      <div className="relative h-36 bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
        {event.heroImageUrl && (
          <img src={event.heroImageUrl} alt={event.title} className="w-full h-full object-cover opacity-75"/>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {event.isLive && <Badge variant="danger" className="text-xs shadow-sm">LIVE</Badge>}
          {event.isPopular && <Badge variant="primary" className="text-xs shadow-sm">POPULAR</Badge>}
          {event.isLimited && <Badge variant="warning" className="text-xs shadow-sm">LIMITED</Badge>}
        </div>
        <div className="absolute top-2 right-2 bg-white/90 rounded-lg px-2 py-1 text-center">
          <p className="text-indigo-600 font-bold text-xs">{formatDate(event.date).split(' ')[0].toUpperCase()}</p>
          <p className="text-gray-900 font-bold text-sm leading-none">{formatDate(event.date).split(' ')[1].replace(',','')}</p>
        </div>
      </div>
      <div className="p-3">
        <Link to={`/events/${event.id}`}>
          <h3 className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors truncate">{event.title}</h3>
        </Link>
        <div className="flex items-center gap-3 mt-1.5 text-gray-500 text-xs">
          <span className="flex items-center gap-1"><Clock size={11}/>{formatTime(event.startTime)}</span>
          <span className="flex items-center gap-1"><Users size={11}/>{event.registrationCount.toLocaleString()} attending</span>
        </div>
      </div>
    </div>
  );
};
