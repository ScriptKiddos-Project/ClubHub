import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Shield, User, Palette, Save, Home } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../utils';
import toast from 'react-hot-toast';

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: <User size={16}/> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16}/> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={16}/> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16}/> },
];

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Settings saved!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Tabs */}
        <aside className="sm:w-48 shrink-0">
          <nav className="space-y-0.5">
            {SETTINGS_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50')}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <Card className="flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900">Profile Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={user?.name} placeholder="Your name"/>
                <Input label="Email" type="email" defaultValue={user?.email} disabled/>
              </div>
              <Input label="Department" defaultValue={user?.department} placeholder="e.g. Computer Science"/>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Enrollment Year" type="number" defaultValue={user?.enrollmentYear}/>
                <Input label="GPA (Optional)" type="number" step="0.01" min="0" max="4" defaultValue={user?.gpa}/>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900">Notification Preferences</h2>
              {[
                { label: 'Event Reminders', desc: 'Get notified 1 hour before events you are registered for' },
                { label: 'Attendance Confirmed', desc: 'Receive confirmation when your check-in is recorded' },
                { label: 'Club Updates', desc: 'News and announcements from clubs you have joined' },
                { label: 'Points & Achievements', desc: 'When you earn points or unlock a new badge' },
                { label: 'New Event Recommendations', desc: 'AI-curated events matching your interests' },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button className="relative w-10 h-5 bg-indigo-600 rounded-full shrink-0 transition-colors">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"/>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900">Privacy Settings</h2>
              {[
                { label: 'Show my profile to other students', enabled: true },
                { label: 'Allow clubs to see my attendance history', enabled: true },
                { label: 'Show in "Friends Here" on event check-ins', enabled: true },
                { label: 'Share profile with recruiters', enabled: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm text-gray-800">{item.label}</p>
                  <button className={cn('relative w-10 h-5 rounded-full shrink-0 transition-colors', item.enabled ? 'bg-indigo-600' : 'bg-gray-200')}>
                    <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', item.enabled ? 'translate-x-5' : 'translate-x-0.5')}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900">Appearance</h2>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Theme</p>
                <div className="flex gap-3">
                  {['Light', 'Dark', 'System'].map((t) => (
                    <button key={t} className={cn('flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all', t === 'Light' ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Language</p>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option>English (Default)</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button onClick={handleSave} loading={saving} leftIcon={<Save size={15}/>}>Save Changes</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── MANAGEMENT PAGE ──────────────────────────────────────────────────────────
export const ManagementPage: React.FC = () => (
  <div className="p-6 max-w-4xl mx-auto">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Club Management</h1>
    <p className="text-gray-500 text-sm mb-6">Manage your club members, roles, and settings</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        { title: 'Member Roster', desc: 'View and manage all club members and their roles', icon: '👥', link: '/management/members' },
        { title: 'Event Management', desc: 'Create, edit, and monitor your club events', icon: '📅', link: '/events/create' },
        { title: 'Attendance Reports', desc: 'Download and analyze attendance for all events', icon: '📊', link: '/admin/dashboard' },
        { title: 'Club Settings', desc: 'Update club profile, banner, and social links', icon: '⚙️', link: '/settings' },
      ].map((item) => (
        <Link key={item.title} to={item.link}>
          <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer h-full">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Card>
        </Link>
      ))}
    </div>
  </div>
);

// ─── 404 PAGE ─────────────────────────────────────────────────────────────────
export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
    <div className="text-8xl font-black text-gray-100 select-none">404</div>
    <h1 className="text-2xl font-bold text-gray-900 -mt-4">Page not found</h1>
    <p className="text-gray-500 mt-2 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
      <Home size={16}/> Back to Dashboard
    </Link>
  </div>
);
export const UnauthorizedPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
    <h1 className="text-8xl font-bold text-indigo-600 mb-4">403</h1>
    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
    <p className="text-gray-500 mb-6">You don't have permission to view this page.</p>
    <a href="/dashboard" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
      Go to Dashboard
    </a>
  </div>
);