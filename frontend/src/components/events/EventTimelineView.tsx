import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { cn, formatTime } from '../../utils';
import { Badge } from '../ui';
import type { Event } from '../../types';

const EVENT_TYPE_COLORS: Record<string, string> = {
  workshop:    'bg-blue-500',
  seminar:     'bg-purple-500',
  hackathon:   'bg-orange-500',
  social:      'bg-pink-500',
  competition: 'bg-red-500',
  webinar:     'bg-teal-500',
};

function groupByDate(events: Event[]): Record<string, Event[]> {
  return events.reduce<Record<string, Event[]>>((acc, e) => {
    const d = e.date.slice(0, 10);
    (acc[d] ??= []).push(e);
    return acc;
  }, {});
}

function getDays(baseDate: Date, count = 7): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

interface EventTimelineViewProps {
  events: Event[];
  onRegister?: (id: string) => void;
  onUnregister?: (id: string) => void;
}

const TimelineEventBlock: React.FC<{ event: Event }> = ({ event }) => {
  const color = EVENT_TYPE_COLORS[event.eventType] ?? 'bg-indigo-500';
  const spots = event.capacity - event.registrationCount;

  return (
    <Link
      to={`/events/${event.id}`}
      className={cn(
        'group flex flex-col px-3 py-2.5 rounded-xl text-white text-xs font-medium',
        'hover:opacity-90 transition-opacity cursor-pointer',
        color,
      )}
    >
      <span className="font-bold truncate">{event.title}</span>
      <div className="flex items-center gap-1 mt-1 opacity-80">
        <Clock size={9} />
        <span>{formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5 opacity-80">
        <MapPin size={9} />
        <span className="truncate">{event.venue}</span>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1 opacity-80">
          <Users size={9} />
          <span>{spots > 0 ? `${spots} left` : 'Full'}</span>
        </div>
        {event.isRegistered && <CheckCircle2 size={11} className="text-green-300" />}
      </div>
    </Link>
  );
};

export const EventTimelineView: React.FC<EventTimelineViewProps> = ({ events }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const days = getDays(baseDate);
  const grouped = groupByDate(events);
  const todayStr = new Date().toISOString().slice(0, 10);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabel = baseDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((p) => p - 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <button onClick={() => setWeekOffset(0)} className="px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            Today
          </button>
          <button onClick={() => setWeekOffset((p) => p + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100">
        {days.map((day) => {
          const d = new Date(day + 'T00:00:00');
          const isToday = day === todayStr;
          return (
            <div key={day} className={cn('flex flex-col items-center py-3 text-center border-r border-gray-100 last:border-r-0', isToday && 'bg-indigo-50')}>
              <span className="text-xs text-gray-400">{dayLabels[d.getDay()]}</span>
              <span className={cn('text-base font-bold mt-0.5', isToday ? 'text-indigo-600' : 'text-gray-800')}>{d.getDate()}</span>
              {(grouped[day]?.length ?? 0) > 0 && (
                <span className="mt-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">
                  {grouped[day].length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 min-h-70">
        {days.map((day) => {
          const dayEvents = grouped[day] ?? [];
          const isToday = day === todayStr;
          return (
            <div key={day} className={cn('border-r border-gray-100 last:border-r-0 p-2 space-y-2', isToday && 'bg-indigo-50/30')}>
              {dayEvents.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-gray-300">—</span>
                </div>
              ) : (
                dayEvents.map((event) => <TimelineEventBlock key={event.id} event={event} />)
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-full', color)} />
            <span className="text-xs text-gray-500 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EventTimelineList: React.FC<{ events: Event[] }> = ({ events }) => {
  const grouped = groupByDate(events);
  const sortedDates = Object.keys(grouped).sort();
  const todayStr = new Date().toISOString().slice(0, 10);

  if (sortedDates.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No upcoming events.</p>;
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const d = new Date(date + 'T00:00:00');
        const isToday = date === todayStr;
        const label = isToday
          ? 'Today'
          : d.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' });

        return (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-2 h-2 rounded-full', isToday ? 'bg-indigo-600' : 'bg-gray-300')} />
              <h4 className={cn('text-sm font-bold', isToday ? 'text-indigo-600' : 'text-gray-500')}>{label}</h4>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-2 pl-5">
              {grouped[date].map((event) => {
                const color = EVENT_TYPE_COLORS[event.eventType] ?? 'bg-indigo-500';
                return (
                  <Link key={event.id} to={`/events/${event.id}`}
                    className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-sm hover:border-indigo-200 transition-all group">
                    <div className={cn('w-1 self-stretch rounded-full mt-1 shrink-0', color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{event.title}</p>
                        {event.isRegistered && <Badge variant="success" className="shrink-0 text-xs">Registered</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={10} />{formatTime(event.startTime)}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{event.venue}</span>
                        <span className="flex items-center gap-1"><Users size={10} />{event.capacity - event.registrationCount} spots left</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};