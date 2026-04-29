// pages/student/AnnouncementsPage.tsx
// Phase 4: Read-only announcement feed for students.
// Shows all announcements from clubs the student belongs to.

import React, { useEffect, useState } from 'react';
import { Megaphone, Pin, Bell } from 'lucide-react';
import { cn } from '../../utils';
import { Card, Skeleton } from '../../components/ui';
import { fetchAnnouncements } from '../../services/phase4Service';
import type { Announcement } from '../../types/phase4';

// ── Announcement card ─────────────────────────────────────────────────────────
const AnnouncementCard: React.FC<{ ann: Announcement }> = ({ ann }) => (
  <Card className={cn(
    'relative transition-all duration-200 hover:shadow-md',
    ann.isPinned && 'border-indigo-200 bg-indigo-50/40'
  )}>
    {ann.isPinned && (
      <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
        <Pin size={9} /> Pinned
      </div>
    )}

    <div className="flex items-start gap-3">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
        <Megaphone size={16} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {ann.clubName}
          </span>
          <span className="text-[11px] text-gray-400">
            {new Date(ann.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mt-1.5">{ann.title}</h3>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-line">
          {ann.body}
        </p>

        <p className="text-[11px] text-gray-400 mt-2">
          Posted by <span className="font-medium text-gray-500">{ann.authorName}</span>
        </p>
      </div>
    </div>
  </Card>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────
const AnnSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements()
      .then((data) => {
        // Pinned first, then by createdAt desc
        const sorted = [...data].sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setAnnouncements(sorted);
      })
      .catch(() => setError('Failed to load announcements.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Bell size={18} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
          <p className="text-xs text-gray-500">Updates from your clubs</p>
        </div>
      </div>

      {loading && <AnnSkeleton />}
      {error && (
        <div className="py-10 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && announcements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone size={36} className="text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No announcements yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Join a club to start seeing announcements here.
          </p>
        </div>
      )}

      {!loading && announcements.map((ann) => (
        <AnnouncementCard key={ann.id} ann={ann} />
      ))}
    </div>
  );
};

export default AnnouncementsPage;
