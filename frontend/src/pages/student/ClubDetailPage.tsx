import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Globe, ExternalLink, Settings } from 'lucide-react';
import { useClub } from '../../hooks/useClubs';
import { useEvents } from '../../hooks/useEvents';
import { clubService } from '../../services/clubService';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card, Badge, Avatar, Spinner, EmptyState } from '../../components/ui';
import { EventCard } from '../../components/events/EventCard';
import { cn, categoryColor } from '../../utils';
import toast from 'react-hot-toast';
import type { Club } from '../../types';

const MOCK_CLUB: Club = {
  id: '1',
  name: 'AI Research Club',
  slug: 'ai-research',
  category: 'technology',
  description: 'Focused on cutting-edge AI research, neural architecture exploration, and real-world machine learning applications. We host weekly paper readings, monthly project showcases, and the annual DeepLink Hackathon. Open to all students passionate about AI, regardless of prior experience.',
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
  { name: 'Aisha Okonkwo', role: 'Member', dept: 'Computer Science' },
];

const categoryLabel: Record<string, string> = {
  technology: 'Technology', arts_culture: 'Arts & Culture', sports: 'Sports',
  academic: 'Academic', social: 'Social', career_prep: 'Career Prep',
  development: 'Development', creative_arts: 'Creative Arts',
};

const ClubDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { club: fetchedClub, loading } = useClub(id ?? '');
  const club = fetchedClub ?? MOCK_CLUB;

  const { events, registerForEvent } = useEvents({ clubId: id, autoFetch: !!id });

  // FIX: derive initial value from club directly; track optimistic toggle locally.
  // No useEffect needed — initialising from the latest club value on each render
  // would reset user's optimistic update, so we use a local override instead.
  const [joinedOverride, setJoinedOverride] = useState<boolean | null>(null);
  const isJoined = joinedOverride !== null ? joinedOverride : (club.isJoined ?? false);

  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'members'>('about');

  const isManager = user?.role === 'secretary' || user?.role === 'event_manager' || user?.role === 'super_admin';

  const handleJoinLeave = async () => {
    setJoining(true);
    // Optimistic update
    setJoinedOverride(!isJoined);
    try {
      if (isJoined) {
        await clubService.leave(club.id);
        toast.success('Left club');
      } else {
        await clubService.join(club.id);
        toast.success(`🎉 Joined ${club.name}!`);
      }
    } catch {
      // Revert optimistic update on failure
      setJoinedOverride(isJoined);
      toast.error('Action failed. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg"/></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={16}/> Back to Clubs
      </button>

      {/* Hero banner */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-linear-to-br from-indigo-600 to-purple-700">
        {club.bannerUrl && <img src={club.bannerUrl} alt="" className="w-full h-full object-cover opacity-60"/>}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent"/>
      </div>

      {/* Club header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 relative z-10 px-2">
        <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-indigo-700 font-black text-3xl shrink-0">
          {club.logoUrl ? <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover"/> : club.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-gray-900">{club.name}</h1>
            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', categoryColor(club.category))}>
              {categoryLabel[club.category]}
            </span>
            {club.rankingScore && club.rankingScore > 90 && (
              <Badge variant="warning" className="text-xs">⭐ Top Rated</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Users size={13}/> {club.memberCount} members</span>
            {club.upcomingEventCount !== undefined && (
              <span className="flex items-center gap-1"><Calendar size={13}/> {club.upcomingEventCount} upcoming events</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isManager && (
            <Button size="sm" variant="outline" leftIcon={<Settings size={14}/>}
              onClick={() => navigate('/management')}>
              Manage
            </Button>
          )}
          <Button
            size="sm"
            variant={isJoined ? 'outline' : 'primary'}
            loading={joining}
            onClick={handleJoinLeave}
          >
            {isJoined ? 'Leave Club' : 'Join Club'}
          </Button>
        </div>
      </div>

      {/* Social links */}
      {club.socialLinks && (
        <div className="flex items-center gap-3">
          {club.socialLinks.website && (
            <a href={club.socialLinks.website} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
              <Globe size={15}/> Website
            </a>
          )}
          {club.socialLinks.instagram && (
            <a href={club.socialLinks.instagram} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-pink-600 transition-colors">
              <ExternalLink size={15}/> Instagram
            </a>
          )}
          {club.socialLinks.linkedin && (
            <a href={club.socialLinks.linkedin} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <ExternalLink size={15}/> LinkedIn
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 pb-0">
        {(['about', 'events', 'members'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all capitalize',
              activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2">
            <h2 className="font-bold text-gray-900 mb-3">About</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{club.description}</p>
          </Card>
          <div className="space-y-4">
            <Card>
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Club Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Members', value: club.memberCount },
                  { label: 'Events Hosted', value: 28 },
                  { label: 'Avg Attendance', value: '87%' },
                  { label: 'Points Awarded', value: '14,200' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className="text-sm font-bold text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            {isJoined && (
              <Card className="bg-indigo-50 border-indigo-100">
                <p className="text-sm font-semibold text-indigo-700 mb-1">✅ You're a member</p>
                <p className="text-xs text-indigo-500">You'll receive announcements and event updates from this club.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(events.length > 0 ? events : []).map((event) => (
              <EventCard key={event.id} event={event} variant="featured" onRegister={registerForEvent}/>
            ))}
            {events.length === 0 && (
              <div className="col-span-3">
                <EmptyState title="No upcoming events" description="This club hasn't scheduled any events yet." icon={<Calendar size={24}/>}/>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_MEMBERS.map((member) => (
            <Card key={member.name} className="flex items-center gap-3">
              <Avatar name={member.name} size="md"/>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{member.name}</p>
                <p className="text-xs text-gray-500 truncate">{member.dept}</p>
                <Badge
                  variant={member.role === 'President' ? 'primary' : member.role === 'Secretary' ? 'success' : member.role === 'Event Manager' ? 'warning' : 'default'}
                  className="text-xs mt-1"
                >
                  {member.role}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubDetailPage;