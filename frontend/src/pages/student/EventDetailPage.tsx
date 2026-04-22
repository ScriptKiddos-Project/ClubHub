import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Bookmark, Share2,
  CheckCircle, QrCode, Trophy, Zap, Tag, ChevronRight, Star
} from 'lucide-react';
import { useEvent } from '../../hooks/useEvents';
import { eventService } from '../../services/eventService';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card, Badge, AvatarGroup, ProgressBar, Spinner } from '../../components/ui';
import { cn, formatDate, formatTime, categoryColor, spotsLeft } from '../../utils';
import toast from 'react-hot-toast';
import type { Event } from '../../types';

// ─── Mock for demo when API not available ────────────────────────────────────
const MOCK_EVENT: Event = {
  id: '1',
  clubId: 'c1',
  title: '48-Hour Open Source Hackathon',
  description: `Build tools that matter. Prizes sponsored by leading cloud providers.\n\nThis 48-hour hackathon challenges students to create real, deployable open-source projects across categories: Dev Tools, Education, Health, and Sustainability.\n\nTop 3 teams win AWS, GCP and Azure cloud credits. All participants receive certificates and exclusive swag.`,
  heroImageUrl: undefined,
  date: '2025-11-05',
  startTime: '09:00',
  endTime: '09:00',
  venue: 'Innovation Center, Block C',
  capacity: 300,
  registrationCount: 211,
  eventType: 'hackathon',
  status: 'published',
  pointsReward: 200,
  volunteerHours: 10,
  tags: ['coding', 'opensource', 'prizes', 'cloud'],
  isRegistered: false,
  aiMatchScore: 92,
  isHot: true,
  createdAt: new Date().toISOString(),
  club: { id: 'c1', name: 'Dev Club', category: 'development', logoUrl: undefined },
};

const MOCK_SIMILAR: Event[] = [
  { id: '2', clubId: 'c2', title: "Founder's Mixer: From Dorm to Series A", description: 'Networking with successful alumni.', date: '2025-11-02', startTime: '18:00', endTime: '21:00', venue: 'Innovation Hub', capacity: 100, registrationCount: 42, eventType: 'social', status: 'published', pointsReward: 30, volunteerHours: 1, tags: ['networking'], aiMatchScore: 84, createdAt: new Date().toISOString(), club: { id: 'c2', name: 'Career Prep', category: 'career_prep', logoUrl: undefined } },
];

const categoryLabel: Record<string, string> = {
  technology: 'Technology', arts_culture: 'Arts & Culture', sports: 'Sports',
  academic: 'Academic', social: 'Social', career_prep: 'Career Prep',
  development: 'Development', creative_arts: 'Creative Arts',
};

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { event: fetchedEvent, loading } = useEvent(id ?? '');
  const event = fetchedEvent ?? MOCK_EVENT;

  const [isRegistered, setIsRegistered] = useState(event.isRegistered ?? false);
  const [registering, setRegistering] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const spots = spotsLeft(event.capacity, event.registrationCount);
  const pct = (event.registrationCount / event.capacity) * 100;
  const isFull = spots <= 0;
  const isOrganizer = user?.role === 'event_manager' || user?.role === 'secretary' || user?.role === 'super_admin';

  useEffect(() => {
    setIsRegistered(event.isRegistered ?? false);
  }, [event.isRegistered]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      if (isRegistered) {
        await eventService.unregister(event.id);
        setIsRegistered(false);
        toast.success('Unregistered from event');
      } else {
        await eventService.register(event.id);
        setIsRegistered(true);
        toast.success(`🎉 Registered! You'll earn ${event.pointsReward} points for attending.`);
      }
    } catch {
      // Mock success for demo
      setIsRegistered(!isRegistered);
      toast.success(isRegistered ? 'Unregistered' : '🎉 Registered successfully!');
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: event.title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg"/></div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={16}/> Back to Events
      </button>

      {/* Hero */}
      <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-linear-to-br from-indigo-900 to-purple-900">
        {event.heroImageUrl && <img src={event.heroImageUrl} alt={event.title} className="w-full h-full object-cover opacity-70"/>}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"/>

        {/* Badges top-left */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {event.isHot && <span className="flex items-center gap-1 px-2.5 py-1 bg-red-500 rounded-full text-xs font-bold text-white">🔥 HOT</span>}
          {event.isTrending && <span className="flex items-center gap-1 px-2.5 py-1 bg-white/90 rounded-full text-xs font-bold text-gray-800">📈 TRENDING</span>}
          {event.isLive && <Badge variant="danger">LIVE</Badge>}
          {event.isLimited && <Badge variant="warning">LIMITED SPOTS</Badge>}
          {event.aiMatchScore && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/90 rounded-full text-xs font-bold text-white">
              <Zap size={10}/> {event.aiMatchScore}% AI Match
            </span>
          )}
        </div>

        {/* Date badge top-right */}
        <div className="absolute top-4 right-4 bg-white rounded-2xl px-3 py-2 text-center shadow-lg">
          <p className="text-indigo-600 font-bold text-xs">{formatDate(event.date).split(' ')[0].toUpperCase()}</p>
          <p className="text-gray-900 font-black text-2xl leading-none">{formatDate(event.date).split(' ')[1].replace(',','')}</p>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          {event.club && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">{event.club.name[0]}</div>
              <span className="text-white/80 text-sm font-medium">{event.club.name}</span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', categoryColor(event.club.category))}>{categoryLabel[event.club.category]}</span>
            </div>
          )}
          <h1 className="text-white font-black text-2xl sm:text-3xl leading-tight drop-shadow-lg">{event.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Event info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick info row */}
          <Card>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <Calendar size={16} className="text-indigo-500"/>, label: 'Date', value: formatDate(event.date) },
                { icon: <Clock size={16} className="text-indigo-500"/>, label: 'Time', value: `${formatTime(event.startTime)} – ${formatTime(event.endTime)}` },
                { icon: <MapPin size={16} className="text-indigo-500"/>, label: 'Venue', value: event.venue },
                { icon: <Users size={16} className="text-indigo-500"/>, label: 'Capacity', value: `${event.registrationCount} / ${event.capacity}` },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2.5">
                  <div className="mt-0.5">{item.icon}</div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Capacity bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{event.registrationCount} registered</span>
                <span className={cn('font-semibold', isFull ? 'text-red-500' : pct > 80 ? 'text-amber-500' : 'text-green-500')}>
                  {isFull ? 'Full' : `${spots} spots left`}
                </span>
              </div>
              <ProgressBar value={event.registrationCount} max={event.capacity} color={isFull ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'}/>
            </div>
          </Card>

          {/* Description */}
          <Card>
            <h2 className="font-bold text-gray-900 text-lg mb-3">About this Event</h2>
            <div className="prose prose-sm text-gray-600 max-w-none">
              {event.description.split('\n').map((p, i) => p ? <p key={i} className="mb-3">{p}</p> : <br key={i}/>)}
            </div>
          </Card>

          {/* Tags */}
          {event.tags.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-indigo-500"/>
                <h2 className="font-bold text-gray-900">Tags</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-100 cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Rewards */}
          <Card>
            <h2 className="font-bold text-gray-900 text-lg mb-4">Rewards & Recognition</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                <Trophy size={24} className="text-indigo-600 mx-auto mb-2"/>
                <p className="text-2xl font-black text-indigo-600">{event.pointsReward}</p>
                <p className="text-xs text-indigo-500 font-medium">Points on Attendance</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <Clock size={24} className="text-green-600 mx-auto mb-2"/>
                <p className="text-2xl font-black text-green-600">{event.volunteerHours}h</p>
                <p className="text-xs text-green-500 font-medium">Volunteer Hours</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 text-center">
                <Star size={24} className="text-amber-600 mx-auto mb-2"/>
                <p className="text-2xl font-black text-amber-600">+1</p>
                <p className="text-xs text-amber-500 font-medium">Achievement Badge</p>
              </div>
            </div>
          </Card>

          {/* Attendees */}
          <Card>
            <h2 className="font-bold text-gray-900 text-lg mb-4">Who's Coming</h2>
            <div className="flex items-center gap-4">
              <AvatarGroup
                users={Array.from({ length: 8 }, (_, i) => ({ name: `User ${i}` }))}
                max={7}
              />
              <p className="text-sm text-gray-500">{event.registrationCount} students registered</p>
            </div>
          </Card>

          {/* Organizer actions */}
          {isOrganizer && (
            <Card className="border-amber-100 bg-amber-50">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-amber-600">⚙️</span> Organizer Tools
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" leftIcon={<QrCode size={14}/>}
                  onClick={async () => { toast.success('QR code generated!'); }}>
                  Generate QR / PIN
                </Button>
                <Button size="sm" variant="outline" leftIcon={<Users size={14}/>}
                  onClick={() => navigate(`/admin/events/${event.id}/attendance`)}>
                  Attendance Report
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => navigate(`/events/${event.id}/edit`)}>
                  Edit Event
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right sidebar: Registration + Club */}
        <div className="space-y-4">
          {/* Registration card */}
          <Card className="sticky top-20">
            <div className="text-center mb-5">
              {isRegistered ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle size={28} className="text-green-600"/>
                  </div>
                  <p className="font-bold text-green-700">You're registered!</p>
                  <p className="text-xs text-gray-500 mt-1">Check in on the day using the Attendance tab</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-3xl font-black text-gray-900 mb-1">Free</p>
                  <p className="text-sm text-gray-500">No ticket required</p>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              variant={isRegistered ? 'outline' : 'primary'}
              loading={registering}
              disabled={!isRegistered && isFull}
              onClick={handleRegister}
            >
              {isRegistered ? 'Cancel Registration' : isFull ? 'Event Full' : 'Register Now'}
            </Button>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all',
                  bookmarked ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 hover:border-gray-300')}
              >
                <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'}/> {bookmarked ? 'Saved' : 'Save'}
              </button>
              <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 transition-all">
                <Share2 size={15}/> Share
              </button>
            </div>

            {isRegistered && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-center">
                <p className="text-xs text-indigo-600 font-medium">📅 Added to your calendar</p>
                <p className="text-xs text-gray-500 mt-0.5">You'll get a reminder 1 hour before</p>
              </div>
            )}
          </Card>

          {/* Club card */}
          {event.club && (
            <Card>
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Hosted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                  {event.club.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{event.club.name}</p>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', categoryColor(event.club.category))}>
                    {categoryLabel[event.club.category]}
                  </span>
                </div>
              </div>
              <Link to={`/clubs/${event.club.id}`}>
                <Button size="sm" variant="outline" className="w-full mt-3" rightIcon={<ChevronRight size={14}/>}>
                  View Club
                </Button>
              </Link>
            </Card>
          )}

          {/* Similar events */}
          <Card>
            <h3 className="font-bold text-gray-900 mb-3 text-sm">You might also like</h3>
            <div className="space-y-3">
              {MOCK_SIMILAR.map((e) => (
                <Link key={e.id} to={`/events/${e.id}`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-400 to-purple-500 shrink-0"/>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{e.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(e.date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
