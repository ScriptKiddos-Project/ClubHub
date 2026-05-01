import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useClubs } from '../../hooks/useClubs';
import { ClubCard } from '../../components/clubs/ClubCard';
import { CardSkeleton, EmptyState, Badge } from '../../components/ui';
import { cn } from '../../utils';
import type { Club } from '../../types';

const CATEGORIES = [
  { value: '', label: 'All Clubs' },
  { value: 'technology', label: 'Technology' },
  { value: 'arts_culture', label: 'Arts & Culture' },
  { value: 'sports', label: 'Sports' },
  { value: 'academic', label: 'Academic' },
  { value: 'career_prep', label: 'Career Prep' },
  { value: 'development', label: 'Development' },
];

const MOCK_CLUBS: Club[] = [
  { id: '1', name: 'AI Research Club', slug: 'ai-research', category: 'technology', description: 'Focused on neural architecture research and AI applications in academia.', memberCount: 52, status: 'approved', isJoined: true, upcomingEventCount: 3, createdAt: new Date().toISOString() },
  { id: '2', name: 'Photography Society', slug: 'photo', category: 'arts_culture', description: 'Capture the world through your lens. Weekly shoots and workshops.', memberCount: 38, status: 'approved', isJoined: false, upcomingEventCount: 2, createdAt: new Date().toISOString() },
  { id: '3', name: 'Robotics Workshop', slug: 'robotics', category: 'technology', description: 'Build, program and compete with autonomous robots.', memberCount: 45, status: 'approved', isJoined: false, upcomingEventCount: 1, createdAt: new Date().toISOString() },
  { id: '4', name: 'Entrepreneurship Hub', slug: 'startup', category: 'career_prep', description: 'Turn your ideas into real businesses with weekly mentor sessions.', memberCount: 60, status: 'approved', isJoined: true, upcomingEventCount: 4, createdAt: new Date().toISOString() },
  { id: '5', name: 'Pottery & Clay Studio', slug: 'pottery', category: 'arts_culture', description: 'Unwind and create beautiful ceramics. All skill levels welcome.', memberCount: 22, status: 'approved', isJoined: false, upcomingEventCount: 1, createdAt: new Date().toISOString() },
  { id: '6', name: 'Debate Society', slug: 'debate', category: 'academic', description: 'Sharpen your argumentation and public speaking skills.', memberCount: 34, status: 'approved', isJoined: false, upcomingEventCount: 2, createdAt: new Date().toISOString() },
];

const ClubsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { clubs, loading, fetchClubs } = useClubs();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [activeCategory, setActiveCategory] = useState('');

  const displayClubs = (clubs.length > 0 ? clubs : MOCK_CLUBS).filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || c.category === activeCategory;
    return matchSearch && matchCat;
  });

  const myClubs = displayClubs.filter((c) => c.isJoined);
  const allClubs = displayClubs.filter((c) => !c.isJoined);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clubs</h1>
          {search ? (
            <p className="text-gray-500 text-sm">
              Results for <span className="font-medium text-gray-700">"{search}"</span>
            </p>
          ) : (
            <p className="text-gray-500 text-sm">Discover and join communities that match your interests</p>
          )}
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setActiveCategory(cat.value);
              fetchClubs(cat.value || undefined);
            }}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
              activeCategory === cat.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* My Clubs */}
          {myClubs.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                My Clubs <Badge variant="primary">{myClubs.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myClubs.map((club) => (
                  <ClubCard key={club.id} club={club} />
                ))}
              </div>
            </div>
          )}

          {/* All Clubs */}
          {allClubs.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">
                {search ? 'Matching Clubs' : 'Discover Clubs'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allClubs.map((club) => (
                  <ClubCard key={club.id} club={club} />
                ))}
              </div>
            </div>
          )}

          {displayClubs.length === 0 && (
            <EmptyState
              title="No clubs found"
              description={search ? `No clubs match "${search}". Try a different search.` : 'Try a different category.'}
              icon={<Search size={24} />}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ClubsPage;