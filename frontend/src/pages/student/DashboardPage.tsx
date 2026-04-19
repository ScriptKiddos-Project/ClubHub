import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, Calendar, Clock, ChevronRight, CheckSquare, Users, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Card, Spinner, Badge, ProgressBar, Avatar } from '../../components/ui';
import { EventCard } from '../../components/events/EventCard';
import { formatDate, formatRelative, cn } from '../../utils';
import type { DashboardData } from '../../types';

const MOCK_CHART = [
  { month: 'Jul', count: 2 }, { month: 'Aug', count: 5 }, { month: 'Sep', count: 3 },
  { month: 'Oct', count: 7 }, { month: 'Nov', count: 4 }, { month: 'Dec', count: 6 },
];

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }> = ({ label, value, icon, color, sub }) => (
  <Card className="flex items-center gap-4">
    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', color)}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-indigo-600 font-medium mt-0.5">{sub}</p>}
    </div>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {/* use mock */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg"/>
    </div>
  );

  const pointsToGold = 3000;
  const currentPoints = user?.totalPoints ?? 2450;
  const streakDays = user?.streak ?? 12;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}. 👋</h1>
          <p className="text-gray-500 mt-1 text-sm">Your campus "Digital Atrium" is buzzing with 12 active events today.</p>
        </div>
        <Link to="/events/create">
          <Button leftIcon={<Zap size={15}/>}>Create Event</Button>
        </Link>
      </div>

      {/* Hero stat + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Points card */}
        <Card className="lg:col-span-1 bg-indigo-600 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full"/>
          <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/10 rounded-full"/>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <Badge className="bg-white/20 text-white text-xs">NEXT EVENT</Badge>
              <span className="text-indigo-200 text-xs">Gold Status</span>
            </div>
            <p className="text-sm text-indigo-200 mb-1">Robotics Workshop · 4:00 PM</p>
            {/* Countdown placeholder */}
            <div className="flex gap-2 mb-4">
              {['01', '58', '32'].map((t, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold">{t}</div>
                  <div className="text-indigo-300 text-xs">{['HRS','MIN','SEC'][i]}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-3xl font-bold">{currentPoints.toLocaleString()}</p>
                <p className="text-indigo-200 text-xs">Total Points</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-bold">{streakDays}</p>
                <p className="text-indigo-200 text-xs">Day Streak 🔥</p>
              </div>
            </div>
            <ProgressBar value={currentPoints} max={pointsToGold} className="mt-3 bg-white/20" color="bg-white"/>
            <p className="text-indigo-200 text-xs mt-1">{pointsToGold - currentPoints} pts to Gold Status</p>
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Check-in to event', icon: <CheckSquare size={16}/>, path: '/attendance' },
              { label: 'Join Club', icon: <Users size={16}/>, path: '/clubs' },
              { label: 'Browse Events', icon: <Calendar size={16}/>, path: '/events' },
            ].map((a) => (
              <Link key={a.label} to={a.path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors text-sm font-medium">
                <span className="text-indigo-500">{a.icon}</span>
                {a.label}
                <ChevronRight size={14} className="ml-auto text-gray-400"/>
              </Link>
            ))}
          </div>
        </Card>

        {/* Campus activity */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Campus Activity</h3>
            <Badge variant="danger" dot>LIVE</Badge>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Sarah A.', action: 'checked in for Debate Club', time: '2m ago', avatar: 'SA' },
              { name: 'Mike K.', action: 'joined Tech Innovators', time: '5m ago', avatar: 'MK' },
              { name: 'Priya R.', action: 'registered for AI Symposium', time: '8m ago', avatar: 'PR' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Avatar name={a.name} size="sm"/>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-900"><span className="font-semibold">{a.name}</span> {a.action}</p>
                  <p className="text-xs text-gray-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* For You section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">For You</h2>
            <p className="text-sm text-gray-500">AI-matched based on your interests</p>
          </div>
          <Link to="/events" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
            View Discovery <ChevronRight size={15}/>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.upcomingEvents ?? MOCK_EVENTS).slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} variant="featured"/>
          ))}
        </div>
      </div>

      {/* Bottom row: Live Buzz Map + Upcoming Deadlines + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Events chart */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Events Attended This Semester</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MOCK_CHART} barSize={20}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }}/>
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }}/>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}/>
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Upcoming deadlines */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {[
              { date: '24', month: 'OCT', label: 'Clubs Expo Signup', sub: 'Applications close at midnight', color: 'bg-indigo-600' },
              { date: '27', month: 'OCT', label: 'Hackathon Early Bird', sub: 'Ticket closes for free-reg', color: 'bg-amber-500' },
              { date: '02', month: 'NOV', label: 'Film Society Screening', sub: 'RSVP deadline for reserved seats', color: 'bg-green-500' },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0', d.color)}>
                  <span className="text-xs font-bold leading-none">{d.month}</span>
                  <span className="text-sm font-bold leading-none">{d.date}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.label}</p>
                  <p className="text-xs text-gray-500 truncate">{d.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/events" className="mt-4 block text-center text-sm text-indigo-600 font-medium hover:underline">View All Calendar</Link>
        </Card>
      </div>
    </div>
  );
};

// Mock events for when API isn't available
const MOCK_EVENTS = [
  {
    id: '1', clubId: 'c1', title: 'Digital Renaissance: A Generative Art Showcase', description: 'Explore the boundary between human creativity and machine learning in our annual showcase.', date: '2025-10-28', startTime: '14:00', endTime: '18:00', venue: 'Arts Hall', capacity: 200, registrationCount: 80, eventType: 'workshop' as const, status: 'published' as const, pointsReward: 50, volunteerHours: 2, tags: ['art', 'ai'], isTrending: true, aiMatchScore: 96, createdAt: new Date().toISOString(),
    club: { id: 'c1', name: 'Creative Arts Club', category: 'creative_arts' as const, logoUrl: undefined },
  },
  {
    id: '2', clubId: 'c2', title: "Founder's Mixer: From Dorm to Series A", description: 'Networking event with campus alumni who successfully launched tech startups.', date: '2025-11-02', startTime: '18:00', endTime: '21:00', venue: 'Innovation Hub', capacity: 100, registrationCount: 42, eventType: 'social' as const, status: 'published' as const, pointsReward: 30, volunteerHours: 1, tags: ['networking', 'startup'], aiMatchScore: 84, createdAt: new Date().toISOString(),
    club: { id: 'c2', name: 'Career Prep Club', category: 'career_prep' as const, logoUrl: undefined },
  },
  {
    id: '3', clubId: 'c3', title: '48-Hour Open Source Hackathon', description: 'Build tools that matter. Prizes sponsored by leading cloud providers.', date: '2025-11-05', startTime: '09:00', endTime: '09:00', venue: 'Tech Center', capacity: 300, registrationCount: 150, eventType: 'hackathon' as const, status: 'published' as const, pointsReward: 200, volunteerHours: 10, tags: ['coding', 'opensource'], isHot: true, aiMatchScore: 92, createdAt: new Date().toISOString(),
    club: { id: 'c3', name: 'Dev Club', category: 'development' as const, logoUrl: undefined },
  },
];

export default DashboardPage;
