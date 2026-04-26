import { Sparkles, RefreshCw, Calendar, MapPin } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { format } from 'date-fns';

// Normalizes both API shapes into { event, reason }:
//   Shape A (flat):   { id, title, date, venue, reason?, ... }
//   Shape B (nested): { event: { id, title, date, venue }, reason: string }
function normalize(item: any): { event: any; reason: string } | null {
  if (!item) return null;

  // Shape B — already wrapped
  if (item.event && typeof item.event === 'object') {
    return { event: item.event, reason: item.reason ?? 'Recommended for you' };
  }

  // Shape A — flat event object
  if (item.id && item.title) {
    const { reason, ...event } = item;
    return { event, reason: reason ?? 'Recommended for you' };
  }

  return null;
}

export function RecommendationCards() {
  const { recommendations, isLoading, refresh } = useRecommendations();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Events You Might Like</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card animate-pulse h-40" />
          ))}
        </div>
      </section>
    );
  }

  // Normalize + drop any items that couldn't be parsed
  const normalized = (recommendations ?? [])
    .map(normalize)
    .filter((item): item is { event: any; reason: string } => item !== null);

  if (normalized.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Events You Might Like</h2>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {normalized.map(({ event, reason }) => (
          <div
            key={event.id}
            className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm leading-snug group-hover:text-purple-600 transition-colors line-clamp-2">
                {event.title}
              </h3>
              <span className="shrink-0 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wide">
                AI
              </span>
            </div>

            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {event.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(event.date), 'dd MMM yyyy, h:mm a')}
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venue}
                </div>
              )}
            </div>

            <p className="mt-3 text-[11px] italic text-purple-600 border-t pt-2">
              {reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}