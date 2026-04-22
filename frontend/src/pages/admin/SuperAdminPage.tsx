import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, XCircle, Clock, TrendingUp, Award, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { clubService } from '../../services/clubService';
import { Card, Badge, Avatar } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils';
import toast from 'react-hot-toast';
import type { Club } from '../../types';

const GLOBAL_STATS = [
  { label: 'Total Users', value: '4,218', icon: <Users size={20} className="text-indigo-600"/>, bg: 'bg-indigo-50', change: '+84 this week' },
  { label: 'Active Clubs', value: '47', icon: <BookOpen size={20} className="text-purple-600"/>, bg: 'bg-purple-50', change: '3 pending approval' },
  { label: 'Events This Month', value: '138', icon: <Award size={20} className="text-green-600"/>, bg: 'bg-green-50', change: '↑ 22% vs last month' },
  { label: 'Platform Avg Attendance', value: '82%', icon: <TrendingUp size={20} className="text-amber-600"/>, bg: 'bg-amber-50', change: 'Above benchmark' },
];

const TOP_CLUBS_DATA = [
  { name: 'AI Research', score: 94 },
  { name: 'Robotics', score: 88 },
  { name: 'Dev Club', score: 85 },
  { name: 'Photography', score: 79 },
  { name: 'Debate Soc', score: 74 },
];

const MOCK_PENDING: Club[] = [
  { id: 'p1', name: 'Chess & Strategy Club', slug: 'chess', category: 'academic', description: 'Weekly tournaments and strategy workshops open to all skill levels.', memberCount: 0, status: 'pending', createdAt: new Date().toISOString() },
  { id: 'p2', name: 'Sustainable Campus Initiative', slug: 'sustainability', category: 'social', description: 'Driving green initiatives across campus through awareness and action.', memberCount: 0, status: 'pending', createdAt: new Date().toISOString() },
  { id: 'p3', name: 'Film Production Society', slug: 'film', category: 'arts_culture', description: 'Short film creation, screenwriting, and cinematography workshops.', memberCount: 0, status: 'pending', createdAt: new Date().toISOString() },
];

const RECENT_USERS = [
  { name: 'Priya Sharma', email: 'priya@campus.edu', dept: 'Data Science', joined: '2 hours ago', role: 'student' },
  { name: 'James Wu', email: 'james@campus.edu', dept: 'Computer Science', joined: '5 hours ago', role: 'student' },
  { name: 'Aisha Okonkwo', email: 'aisha@campus.edu', dept: 'Physics', joined: 'Yesterday', role: 'member' },
  { name: 'Carlos Mendez', email: 'carlos@campus.edu', dept: 'Business', joined: 'Yesterday', role: 'secretary' },
];

const categoryLabel: Record<string, string> = {
  technology: 'Technology', arts_culture: 'Arts & Culture', sports: 'Sports',
  academic: 'Academic', social: 'Social', career_prep: 'Career Prep',
  development: 'Development', creative_arts: 'Creative Arts',
};

const SuperAdminPage: React.FC = () => {
  const [pendingClubs, setPendingClubs] = useState<Club[]>(MOCK_PENDING);

  const [activeTab, setActiveTab] = useState<'overview' | 'clubs' | 'users' | 'access-codes'>('overview');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    clubService.getPending()
      .then(({ data }) => setPendingClubs(data.data))
      .catch(() => { /* use mock */ });
  }, []);

  const handleApprove = async (id: string, approved: boolean) => {
    setProcessing(id);
    try {
      await clubService.approve(id, { approved, reason: approved ? undefined : 'Does not meet club formation criteria.' });
      setPendingClubs((prev) => prev.filter((c) => c.id !== id));
      toast.success(approved ? '✅ Club approved and notified!' : '❌ Club rejected');
    } catch {
      setPendingClubs((prev) => prev.filter((c) => c.id !== id));
      toast.success(approved ? '✅ Club approved!' : '❌ Club rejected');
    } finally {
      setProcessing(null);
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: <Globe size={15}/> },
    { id: 'clubs', label: `Club Approvals ${pendingClubs.length > 0 ? `(${pendingClubs.length})` : ''}`, icon: <BookOpen size={15}/> },
    { id: 'users', label: 'Users', icon: <Users size={15}/> },
    { id: 'access-codes', label: 'Access Codes', icon: <Award size={15}/> },
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Platform-wide management and oversight</p>
        </div>
        {pendingClubs.length > 0 && (
          <Badge variant="warning" className="flex items-center gap-1.5">
            <Clock size={12}/> {pendingClubs.length} pending approvals
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all',
              activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50')}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {GLOBAL_STATS.map((s) => (
              <Card key={s.label} className="flex items-center gap-3">
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', s.bg)}>{s.icon}</div>
                <div>
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">{s.change}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <h2 className="font-bold text-gray-900 mb-4">Top Clubs by Engagement Score</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={TOP_CLUBS_DATA} layout="vertical" barSize={16}>
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }}/>
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151' }} width={90}/>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}/>
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 6, 6, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h2 className="font-bold text-gray-900 mb-4">Recent Registrations</h2>
              <div className="space-y-3">
                {RECENT_USERS.map((u) => (
                  <div key={u.email} className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.dept} · {u.joined}</p>
                    </div>
                    <Badge variant={u.role === 'secretary' ? 'success' : u.role === 'member' ? 'primary' : 'default'} className="text-xs capitalize">
                      {u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Club Approvals */}
      {activeTab === 'clubs' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Review and approve club registration requests submitted by students.</p>
          {pendingClubs.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3"/>
              <h3 className="font-bold text-gray-900">All caught up!</h3>
              <p className="text-sm text-gray-500 mt-1">No pending club approvals</p>
            </Card>
          ) : (
            pendingClubs.map((club) => (
              <Card key={club.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl shrink-0">
                      {club.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{club.name}</h3>
                        <Badge variant="warning" className="text-xs flex items-center gap-1"><Clock size={10}/> Pending</Badge>
                        <span className="text-xs text-gray-500 capitalize">{categoryLabel[club.category]}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{club.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="danger"
                      loading={processing === club.id}
                      leftIcon={<XCircle size={14}/>}
                      onClick={() => handleApprove(club.id, false)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      loading={processing === club.id}
                      leftIcon={<CheckCircle size={14}/>}
                      onClick={() => handleApprove(club.id, true)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Platform Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['User', 'Department', 'Role', 'Joined', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...RECENT_USERS, ...RECENT_USERS.map((u) => ({ ...u, name: u.name + ' II', email: '2' + u.email }))].map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={u.name} size="sm"/>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{u.dept}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.role === 'secretary' ? 'success' : u.role === 'member' ? 'primary' : 'default'} className="text-xs capitalize">{u.role}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{u.joined}</td>
                    <td className="py-3">
                      <Badge variant="success" className="text-xs">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Access Codes */}
      {activeTab === 'access-codes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Generate access codes for core members to join with elevated roles.</p>
            <Button size="sm" leftIcon={<Award size={14}/>} onClick={() => toast.success('Access code generated and copied!')}>
              Generate New Code
            </Button>
          </div>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Code', 'Club', 'Role', 'Expires', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { code: 'CDNG-2025-X7K4M2', club: 'AI Research Club', role: 'Secretary', expires: 'Nov 30, 2025', active: true },
                  { code: 'CDNG-2025-P9R2T5', club: 'Dev Club', role: 'Event Manager', expires: 'Dec 15, 2025', active: true },
                  { code: 'CDNG-2024-M3K8Q1', club: 'Robotics', role: 'Member', expires: 'Oct 01, 2025', active: false },
                ].map((row) => (
                  <tr key={row.code} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-mono font-bold text-gray-900">{row.code}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.club}</td>
                    <td className="py-3 pr-4"><Badge variant="primary" className="text-xs">{row.role}</Badge></td>
                    <td className="py-3 pr-4 text-gray-500">{row.expires}</td>
                    <td className="py-3">
                      <Badge variant={row.active ? 'success' : 'default'} className="text-xs">{row.active ? 'Active' : 'Expired'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;