import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Calendar, Globe, ExternalLink, TrendingUp,
  MessageSquarePlus, Settings,
} from 'lucide-react';
import { useClub } from '../../hooks/useClubs';
import { useEvents } from '../../hooks/useEvents';
import { useClubRanking } from '../../hooks/usePhase2';
import { clubService } from '../../services/clubService';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card, Badge, Avatar, Spinner, EmptyState } from '../../components/ui';
import { EventCard } from '../../components/events/EventCard';
import { RankingBadge } from '../../components/rankings/RankingBadge';
import { RankingBreakdownModal } from '../../components/rankings/RankingBreakdownModal';
import { SuggestionBox } from '../../components/clubs/SuggestionBox';
import { cn, categoryColor } from '../../utils';
import toast from 'react-hot-toast';
import type { Club } from '../../types';

const MOCK_CLUB: Club = {
  id: '1',
  name: 'AI Research Club',
  slug: 'ai-research',
  category: 'technology',
  description: 'Focused on cutting-edge AI research, neural architecture exploration, and real-world machine learning applications. We host weekly paper readings, monthly project showcases, and the annual DeepLink Hackathon.',
  memberCount: 52,
  status: 'approved',
  isJoined: false,
  upcomingEventCount: 3,
  socialLinks: {
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    website: 'https://airesearch.campus.edu',
  },
  rankingScore: 94,
  createdAt: new Date().toISOString(),
};

const MOCK_MEMBERS = [
  { name: 'Marcus Thorne', role: 'President', dept: 'Computer Science' },
  { name: 'Priya Sharma', role: 'Secretary', dept: 'Data Science' },
  { name: 'Alex Rivera', role: 'Event Manager', dept: 'AI & ML' },
  { name: 'Sarah Miller', role: 'Member', dept: 'Mathematics' },
  { name: 'James Wu', role: 'Member', dept: 'Software Engineering' },
];

const categoryLabel: Record<string, string> = {
  technology: 'Technology', arts_culture: 'Arts & Culture', sports: 'Sports',
  academic: 'Academic', social: 'Social', career_prep: 'Career Prep',
  development: 'Development', creative_arts: 'Creative Arts',
};

type TabKey = 'about' | 'events' | 'members' | 'suggestions';

const ClubDetailPagePhase2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { club: fetchedClub, loading } = useClub(id ?? '');
  const club = fetchedClub ?? MOCK_CLUB;

  const { events, registerForEvent } = useEvents({ clubId: id, autoFetch: !!id });
  const { breakdown, history, loading: rankingLoading } = useClubRanking(id ?? '');

  const [isJoined, setIsJoined] = useState(club.isJoined ?? false);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('about');
  const [showRankingModal, setShowRankingModal] = useState(false);

  useEffect(() => {
    setIsJoined(club.isJoined ?? false);
  }, [club.isJoined]);

  const handleJoinLeave = async () => {
    setJoining(true);
    try {
      if (isJoined) {
        await clubService.leave(club.id);
        setIsJoined(false);
        toast.success('Left club');
      } else {
        await clubService.join(club.id);
        setIsJoined(true);
        toast.success('Joined club!');
      }
    } catch {
      toast.error('Action failed');
    } finally {
      setJoining(false);
    }
  };

  const canManage =
    user?.role === 'super_admin' ||
    user?.role === 'secretary' ||
    user?.role === 'event_manager';

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'about', label: 'About' },
    { key: 'events', label: `Events (${events.length || (club.upcomingEventCount ?? 0)})` },
    { key: 'members', label: 'Members' },
    { key: 'suggestions', label: 'Suggestions' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Back to Clubs
      </button>

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 h-40">
        {club.bannerUrl && (
          <img src={club.bannerUrl} alt="" className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Category badge */}
        <span className={cn('absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold', categoryColor(club.category))}>
          {categoryLabel[club.category] ?? club.category}
        </span>
      </div>

      {/* Club header card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-2xl -mt-10 shrink-0 ml-4 sm:ml-0">
            {club.logoUrl
              ? <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
              : club.name[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{club.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Users size={13} /> {club.memberCount} members
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar size={13} /> {club.upcomingEventCount ?? 0} upcoming events
                  </span>

                  {/* ── Phase 2: Ranking badge ── */}
                  {breakdown && (
                    <button
                      onClick={() => setShowRankingModal(true)}
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <RankingBadge tier={breakdown.tier} rank={breakdown.rank} size="sm" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* ── Phase 2: Ranking breakdown button ── */}
                {breakdown && (
                  <button
                    onClick={() => setShowRankingModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                  >
                    <TrendingUp size={14} />
                    <span className="hidden sm:inline">Ranking</span>
                  </button>
                )}

                {canManage && (
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <Settings size={15} className="text-gray-500" />
                  </button>
                )}

                <Button
                  size="sm"
                  variant={isJoined ? 'outline' : 'primary'}
                  onClick={handleJoinLeave}
                  disabled={joining}
                >
                  {joining ? '...' : isJoined ? 'Leave Club' : 'Join Club'}
                </Button>
              </div>
            </div>

            {/* Social links */}
            {club.socialLinks && (
              <div className="flex items-center gap-3 mt-3">
                {club.socialLinks.website && (
                  <a href={club.socialLinks.website} target="_blank" rel="noreferrer"
                     className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                    <Globe size={12} /> Website <ExternalLink size={10} />
                  </a>
                )}
                {club.socialLinks.instagram && (
                  <a href={club.socialLinks.instagram} target="_blank" rel="noreferrer"
                     className="text-xs text-pink-600 hover:underline">Instagram</a>
                )}
                {club.socialLinks.linkedin && (
                  <a href={club.socialLinks.linkedin} target="_blank" rel="noreferrer"
                     className="text-xs text-blue-600 hover:underline">LinkedIn</a>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
              activeTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'about' && (
        <Card>
          <h2 className="text-base font-bold text-gray-900 mb-3">About</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{club.description}</p>

          {breakdown && (
            <div className="mt-5 p-4 bg-indigo-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                  <TrendingUp size={14} /> Club Performance
                </h3>
                <button
                  onClick={() => setShowRankingModal(true)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Full breakdown →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Overall Score', value: breakdown.totalScore.toFixed(1) },
                  { label: 'Rank', value: `#${breakdown.rank}` },
                  { label: 'Tier', value: breakdown.tier.charAt(0).toUpperCase() + breakdown.tier.slice(1) },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-xl font-black text-indigo-600">{value}</div>
                    <div className="text-xs text-indigo-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <EmptyState
              title="No upcoming events"
              description="This club hasn't scheduled any events yet."
              icon={<Calendar size={24} />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={registerForEvent}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <Card>
          <h2 className="text-base font-bold text-gray-900 mb-4">Core Team</h2>
          <div className="space-y-3">
            {MOCK_MEMBERS.map((member) => (
              <div key={member.name} className="flex items-center gap-3">
                <Avatar name={member.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.dept}</p>
                </div>
                <Badge variant="primary" className="text-xs shrink-0">{member.role}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Phase 2: Suggestion Box tab ── */}
      {activeTab === 'suggestions' && (
        <Card>
          <SuggestionBox clubId={id ?? club.id} />
        </Card>
      )}

      {/* Ranking breakdown modal */}
      <RankingBreakdownModal
        open={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        breakdown={breakdown}
        history={history}
        clubName={club.name}
        loading={rankingLoading}
      />
    </div>
  );
};

export default ClubDetailPagePhase2;
