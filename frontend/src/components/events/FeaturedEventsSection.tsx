import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Users, Calendar, Clock, Zap } from 'lucide-react';
import { cn, formatDate, formatTime } from '../../utils';
import { useFeaturedEvents } from '../../hooks/usePhase2';
import type { FeaturedEvent } from '../../types/phase2';

const FeaturedEventCard: React.FC<{ event: FeaturedEvent }> = ({ event }) => {
  const spots = event.capacity - event.registrationCount;
  const pct = Math.round((event.registrationCount / event.capacity) * 100);

  return (
    <Link
      to={`/events/${event.id}`}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
    >
      {/* Hero */}
      <div className="relative h-44 bg-gradient-to-br from-indigo-900 to-purple-900 overflow-hidden shrink-0">
        {event.heroImageUrl && (
          <img
            src={event.heroImageUrl}
            alt={event.title}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {/* Hot badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-red-500 rounded-full text-white text-xs font-bold">
          <Flame size={10} /> HOT
        </div>
        {/* Engagement pill */}
        <div className="absolute bottom-3 right-3 bg-black/60 rounded-full px-2.5 py-1 text-white text-xs font-semibold flex items-center gap-1">
          <Zap size={10} className="text-yellow-400" />
          {pct}% full
        </div>
        {/* Date */}
        <div className="absolute top-3 right-3 bg-white rounded-xl px-2.5 py-1.5 text-center shadow-sm">
          <p className="text-indigo-600 font-bold text-xs">
            {formatDate(event.date).split(' ')[0].toUpperCase()}
          </p>
          <p className="text-gray-900 font-bold text-lg leading-none">
            {formatDate(event.date).split(' ')[1]?.replace(',', '')}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {event.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1">
          {event.title}
        </h3>
        <div className="mt-2 space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={11} />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={11} />
            <span>{formatTime(event.startTime ?? event.date)}</span>
          </div>
          {event.club && (
            <div className="flex items-center gap-1.5">
              <Users size={11} />
              <span>{event.club.name}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{event.registrationCount} registered</span>
            <span className={cn(spots <= 5 ? 'text-red-500 font-semibold' : '')}>{spots} spots left</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500',
              )}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-indigo-600 font-semibold">+{event.pointsReward} pts</span>
          <span className="text-xs text-gray-400">{event.volunteerHours}h volunteer</span>
        </div>
      </div>
    </Link>
  );
};

export const FeaturedEventsSection: React.FC = () => {
  const { events, loading } = useFeaturedEvents(6);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Flame size={18} className="text-red-500" />
          Featured Events
          <span className="text-xs font-normal text-gray-400 ml-1">High engagement picks</span>
        </h2>
        <Link
          to="/events?featured=true"
          className="text-sm text-indigo-600 font-medium hover:underline"
        >
          See all
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No featured events at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <FeaturedEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
};
