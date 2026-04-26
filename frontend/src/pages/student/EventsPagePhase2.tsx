import React, { useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, LayoutGrid, List, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { EventCard } from '../../components/events/EventCard';
import { FeaturedEventsSection } from '../../components/events/FeaturedEventsSection';
import { EventTimelineView, EventTimelineList } from '../../components/events/EventTimelineView';
import { CalendarView } from '../../components/events/CalendarView';
import { AdvancedEventFilters } from '../../components/events/AdvancedEventFilters';
import { Button } from '../../components/ui/Button';
import { CardSkeleton, EmptyState } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils';
import type { EventFilters } from '../../types/phase2';

type ViewMode = 'grid' | 'list' | 'timeline' | 'calendar';

const DEFAULT_FILTERS: EventFilters = {};

const EventsPagePhase2: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    isFeatured: searchParams.get('featured') === 'true' || undefined,
  });

  const { events, loading, registerForEvent, unregisterFromEvent } = useEvents({
    search: searchParams.get('search') ?? undefined,
    clubId: filters.clubId,
    type: filters.eventType,
    tags: filters.tags,
    skillAreas: filters.skillAreas,
    volunteerHoursMin: filters.volunteerHoursMin,
    isFeatured: filters.isFeatured,
  });

  const displayEvents = events.filter((e) => {
    if (filters.tags?.length && !filters.tags.some((t) => e.tags.includes(t))) return false;
    if (filters.skillAreas?.length && !filters.skillAreas.some((s) => e.skillAreas?.includes(s))) return false;
    if (filters.volunteerHoursMin && e.volunteerHours < filters.volunteerHoursMin) return false;
    if (filters.isFeatured && !e.isFeatured) return false;
    return true;
  });

  const handleFilterChange = useCallback((updated: EventFilters) => {
    setFilters(updated);
  }, []);

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount =
    (filters.eventType ? 1 : 0) +
    (filters.skillAreas?.length ?? 0) +
    (filters.tags?.length ?? 0) +
    ((filters.volunteerHoursMin ?? 0) > 0 ? 1 : 0) +
    (filters.isFeatured ? 1 : 0);

  const canCreate =
    user?.role === 'event_manager' ||
    user?.role === 'secretary' ||
    user?.role === 'super_admin';

  // Map events to FullCalendar format
  const EVENT_COLORS: Record<string, string> = {
  hackathon: '#6366f1',
  workshop: '#f59e0b',
  cultural: '#ec4899',
  seminar: '#10b981',
  sports: '#3b82f6',
};

const calendarEvents = displayEvents.map((e) => ({
  id: e.id,
  title: e.title,
  date: e.date,
  color: EVENT_COLORS[e.eventType] ?? '#6366f1',
}));

  return (
    <div className="flex h-full">
      {/* ── Sidebar filters (desktop) ─────────────────── */}
      <aside
        className={cn(
          'shrink-0 border-r border-gray-100 bg-white transition-all duration-300 overflow-hidden',
          showFilters ? 'w-64 px-4 py-5' : 'w-0',
          'hidden lg:block',
        )}
      >
        {showFilters && (
          <AdvancedEventFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        )}
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-500 text-sm">Discover events across all clubs</p>
          </div>
          <div className="flex items-center gap-2">
            {canCreate && (
              <Link to="/events/create">
                <Button size="sm" className="flex items-center gap-1.5">
                  <Plus size={14} /> Create Event
                </Button>
              </Link>
            )}

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                showFilters
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300',
              )}
            >
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-white text-indigo-600 rounded-full text-xs flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View mode toggle */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
              {([
                { mode: 'grid' as ViewMode, icon: <LayoutGrid size={15} />, title: 'Grid view' },
                { mode: 'list' as ViewMode, icon: <List size={15} />, title: 'List view' },
                { mode: 'timeline' as ViewMode, icon: <CalendarIcon size={15} />, title: 'Timeline view' },
                { mode: 'calendar' as ViewMode, icon: <CalendarIcon size={15} />, title: 'Calendar view' },
              ] as const).map(({ mode, icon, title }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'p-2.5 transition-colors',
                    viewMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:text-gray-600',
                  )}
                  title={title}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="lg:hidden">
            <AdvancedEventFilters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-medium">Active filters:</span>
            {filters.isFeatured && (
              <Chip label="Featured" onRemove={() => setFilters((p) => ({ ...p, isFeatured: undefined }))} />
            )}
            {filters.eventType && (
              <Chip label={filters.eventType} onRemove={() => setFilters((p) => ({ ...p, eventType: undefined }))} />
            )}
            {(filters.skillAreas ?? []).map((s) => (
              <Chip
                key={s}
                label={s}
                onRemove={() =>
                  setFilters((p) => ({ ...p, skillAreas: p.skillAreas?.filter((x) => x !== s) }))
                }
              />
            ))}
            {(filters.tags ?? []).map((t) => (
              <Chip
                key={t}
                label={`#${t}`}
                onRemove={() =>
                  setFilters((p) => ({ ...p, tags: p.tags?.filter((x) => x !== t) }))
                }
              />
            ))}
            {(filters.volunteerHoursMin ?? 0) > 0 && (
              <Chip
                label={`${filters.volunteerHoursMin}+ hrs`}
                onRemove={() => setFilters((p) => ({ ...p, volunteerHoursMin: undefined }))}
              />
            )}
            <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">
              Clear all
            </button>
          </div>
        )}

        {/* Featured section — only in grid/list, no active filters */}
        {activeFilterCount === 0 && viewMode !== 'timeline' && viewMode !== 'calendar' && (
          <FeaturedEventsSection />
        )}

        {/* Divider */}
        {activeFilterCount === 0 && viewMode !== 'timeline' && viewMode !== 'calendar' && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Events</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
        )}

        {/* ── Events display ── */}
        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          )
        ) : displayEvents.length === 0 && viewMode !== 'calendar' ? (
          <EmptyState
            title="No events found"
            description="Try adjusting your filters or check back later."
            icon={<CalendarIcon size={24} />}
            action={
              activeFilterCount > 0 ? (
                <button onClick={handleReset} className="text-sm text-indigo-600 font-medium hover:underline">
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                variant="featured"
                onRegister={registerForEvent}
                onUnregister={unregisterFromEvent}
              />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <EventTimelineList events={displayEvents} />
        ) : viewMode === 'timeline' ? (
          <EventTimelineView events={displayEvents} />
        ) : (
          // ── Calendar view (FullCalendar) ──
          <CalendarView
            events={calendarEvents}
            onEventClick={(id) => navigate(`/events/${id}`)}
          />
        )}

        {/* Results count — hide in calendar mode */}
        {!loading && displayEvents.length > 0 && viewMode !== 'calendar' && (
          <p className="text-xs text-gray-400 text-center">
            Showing {displayEvents.length} event{displayEvents.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Removable chip ───────────────────────────────────────────────────────────
const Chip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
    {label}
    <button onClick={onRemove} className="hover:text-indigo-900">
      <X size={10} />
    </button>
  </span>
);

export default EventsPagePhase2;