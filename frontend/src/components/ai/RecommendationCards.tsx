import { Sparkles, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { format } from 'date-fns';

interface RawEvent {
  id: string;
  title: string;
  date?: string;
  venue?: string;
  reason?: string;
  [key: string]: unknown;
}

interface NestedRecommendation {
  event: RawEvent;
  reason?: string;
}

type RawRecommendation = RawEvent | NestedRecommendation;

// Normalizes both API shapes into { event, reason }:
//   Shape A (flat):   { id, title, date, venue, reason?, ... }
//   Shape B (nested): { event: { id, title, date, venue }, reason: string }
function normalize(item: RawRecommendation): { event: RawEvent; reason: string } | null {
  if (!item) return null;

  // Shape B — already wrapped
  if ('event' in item && item.event && typeof item.event === 'object') {
    return { event: item.event as RawEvent, reason: (item as NestedRecommendation).reason ?? 'Recommended for you' };
  }

  // Shape A — flat event object
  if ('id' in item && 'title' in item) {
    const { reason, ...event } = item as RawEvent;
    return { event: event as RawEvent, reason: reason ?? 'Recommended for you' };
  }

  return null;
}

export function RecommendationCards() {
  const { recommendations, isLoading, refresh } = useRecommendations();

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900">Events You Might Like</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-40" />
          ))}
        </div>
      </div>
    );
  }

  const normalized = (recommendations ?? [])
    .map(normalize)
    .filter((item): item is { event: RawEvent; reason: string } => item !== null);

  if (normalized.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900">Events You Might Like</h2>
          <span className="text-xs text-gray-400 font-medium">AI-matched</span>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {normalized.map(({ event, reason }) => (
          <div
            key={event.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                {event.title}
              </h3>
              <span className="shrink-0 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                AI
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-gray-500">
              {event.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {format(new Date(event.date), 'dd MMM yyyy, h:mm a')}
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {event.venue}
                </div>
              )}
            </div>
            <p className="mt-3 text-[11px] italic text-indigo-500 border-t border-gray-50 pt-2">
              {reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}