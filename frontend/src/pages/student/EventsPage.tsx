import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Plus, ChevronDown } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';
import { EventCard } from '../../components/events/EventCard';
import { Button } from '../../components/ui/Button';
import { CardSkeleton, EmptyState } from '../../components/ui';
import { cn } from '../../utils';
import type { Event } from '../../types';

const CATEGORIES = ['Technology', 'Arts & Culture', 'Sports', 'Career Prep', 'Development', 'Academic'];
const TABS = ['All Events', 'For You', 'Saved'];
const POPULARITY_FILTERS = ['Trending', 'Staff Picks', 'AI Matches'];

const MOCK_TODAY: Event[] = [
  { id: 't1', clubId: 'c1', title: 'AI Ethics Symposium', description: '', date: new Date().toISOString(), startTime: '14:00', endTime: '17:00', venue: 'Main Auditorium', capacity: 500, registrationCount: 1200, eventType: 'seminar', status: 'published', pointsReward: 50, volunteerHours: 3, tags: [], isLive: true, createdAt: new Date().toISOString() },
  { id: 't2', clubId: 'c2', title: 'Sunset Beats: Vinyl Night', description: '', date: new Date().toISOString(), startTime: '18:30', endTime: '22:00', venue: 'Rooftop', capacity: 600, registrationCount: 450, eventType: 'social', status: 'published', pointsReward: 20, volunteerHours: 1, tags: [], isPopular: true, createdAt: new Date().toISOString() },
  { id: 't3', clubId: 'c3', title: 'UI/UX Design Sprint', description: '', date: new Date().toISOString(), startTime: '16:00', endTime: '19:00', venue: 'Design Lab', capacity: 30, registrationCount: 25, eventType: 'workshop', status: 'published', pointsReward: 75, volunteerHours: 3, tags: [], isLimited: true, createdAt: new Date().toISOString() },
];

const EventsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Technology']);
  const [timeFrame, setTimeFrame] = useState('This Weekend');
  const [activeTab, setActiveTab] = useState('All Events');
  const [activePop, setActivePop] = useState('Trending');


  const { events, loading, registerForEvent, unregisterFromEvent } = useEvents({
    search: searchParams.get('search') ?? undefined,
  });

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);

  const displayEvents = events.length > 0 ? events : MOCK_FEATURED;

  return (
    <div className="flex h-full">
      {/* Sidebar filters */}
      <aside className="hidden lg:flex w-52 flex-col border-r border-gray-100 bg-white px-4 py-5 shrink-0 space-y-5">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Discovery Filters</h3>
        </div>
        {/* Category */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Category</p>
          <div className="space-y-1.5">
            {CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">{cat}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Time frame */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Time Frame</p>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {['Today', 'This Weekend', 'This Week', 'This Month'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        {/* Price range */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Price Range</p>
          <div className="px-1">
            <input type="range" min={0} max={100} className="w-full accent-indigo-600"/>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$0</span><span>$100+</span>
            </div>
          </div>
        </div>
        {/* Popularity */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Popularity</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULARITY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActivePop(f)}
                className={cn('px-2.5 py-1 rounded-full text-xs font-semibold transition-all', activePop === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {/* Create event CTA */}
        <div className="mt-auto pt-4">
          <Link to="/events/create">
            <Button className="w-full" size="sm" leftIcon={<Plus size={14}/>}>Create Event</Button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Upcoming Today */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Today</h2>
                <p className="text-sm text-gray-500">Don't miss out on these flash events</p>
              </div>
              <Link to="/events?timeframe=today" className="text-sm text-indigo-600 font-medium hover:underline">View Schedule</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MOCK_TODAY.map((event) => <EventCard key={event.id} event={event} variant="compact"/>)}
            </div>
          </div>

          {/* Tabs + sort */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all', activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-xs font-semibold uppercase">Sort By:</span>
              <button className="flex items-center gap-1 font-semibold text-gray-700">DATE <ChevronDown size={14}/></button>
            </div>
          </div>

          {/* Event grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i}/>)}
            </div>
          ) : displayEvents.length === 0 ? (
            <EmptyState title="No events found" description="Try adjusting your filters or check back later." icon={<Filter size={24}/>}/>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          )}
        </div>
      </div>
    </div>
  );
};

const MOCK_FEATURED: Event[] = [
  { id: '1', clubId: 'c1', title: 'Digital Renaissance: A Generative Art Showcase', description: 'Explore the boundary between human creativity and machine learning in our annual showcase.', date: '2025-10-28', startTime: '14:00', endTime: '18:00', venue: 'Arts Hall', capacity: 200, registrationCount: 80, eventType: 'workshop', status: 'published', pointsReward: 50, volunteerHours: 2, tags: ['art', 'ai'], isTrending: true, aiMatchScore: 96, createdAt: new Date().toISOString(), club: { id: 'c1', name: 'Creative Arts', category: 'creative_arts', logoUrl: undefined } },
  { id: '2', clubId: 'c2', title: "Founder's Mixer: From Dorm to Series A", description: 'Networking event with campus alumni who successfully launched tech startups.', date: '2025-11-02', startTime: '18:00', endTime: '21:00', venue: 'Innovation Hub', capacity: 100, registrationCount: 42, eventType: 'social', status: 'published', pointsReward: 30, volunteerHours: 1, tags: ['networking'], aiMatchScore: 84, createdAt: new Date().toISOString(), club: { id: 'c2', name: 'Career Prep', category: 'career_prep', logoUrl: undefined } },
  { id: '3', clubId: 'c3', title: '48-Hour Open Source Hackathon', description: 'Build tools that matter. Prizes sponsored by leading cloud providers.', date: '2025-11-05', startTime: '09:00', endTime: '09:00', venue: 'Tech Center', capacity: 300, registrationCount: 150, eventType: 'hackathon', status: 'published', pointsReward: 200, volunteerHours: 10, tags: ['coding'], isHot: true, aiMatchScore: 92, createdAt: new Date().toISOString(), club: { id: 'c3', name: 'Dev Club', category: 'development', logoUrl: undefined } },
];

export default EventsPage;
