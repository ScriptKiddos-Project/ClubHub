// components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Compass, Calendar, BarChart2, Users, Settings,
  User, X, BookOpen, Shield, Trophy, ClipboardList, ShieldCheck, Megaphone,
} from 'lucide-react';
import { cn } from '../../utils';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Avatar, Badge } from '../ui';

interface NavItem {
  label: string;
  path: string | ((role: string) => string);
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    path: '/dashboard',        icon: <LayoutDashboard size={18}/> },
  { label: 'Discovery',    path: '/events',            icon: <Compass size={18}/> },
  { label: 'Clubs',        path: '/clubs',             icon: <BookOpen size={18}/> },
  { label: 'Rankings',     path: '/rankings',          icon: <Trophy size={18}/> },
  { label: 'Attendance',   path: '/attendance',        icon: <Calendar size={18}/> },
  {
    label: 'Analytics',
    path: (role) => role === 'super_admin' ? '/admin/analytics' : '/analytics',
    icon: <BarChart2 size={18}/>,
  },
  { label: 'Management',   path: '/management',        icon: <Users size={18}/>,         roles: ['secretary', 'event_manager', 'super_admin'] },
  { label: 'Announcements',path: '/announcements',        icon: <Megaphone size={18}/>,     roles: ['secretary', 'event_manager', 'member'] },
  { label: 'Admin',        path: '/admin/dashboard',   icon: <Shield size={18}/>,        roles: ['super_admin', 'secretary', 'event_manager'] },
  { label: 'Recruitment',  path: '/admin/recruitment', icon: <ClipboardList size={18}/>, roles: ['super_admin', 'secretary', 'event_manager'] },
  { label: 'Super Admin',  path: '/admin/super',       icon: <ShieldCheck size={18}/>,   roles: ['super_admin'] },
  { label: 'Profile',      path: '/profile',           icon: <User size={18}/> },
  { label: 'Settings',     path: '/settings',          icon: <Settings size={18}/> },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-100 z-30 flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:z-auto',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ClubHub" className="h-8 w-8 object-contain" />
            <span className="font-bold text-gray-900 text-base">ClubHub</span>
          </div>
          <button
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} className="text-gray-500"/>
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatarUrl} name={user.name} size="sm"/>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <Badge variant="primary" className="text-xs capitalize">
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {visibleItems.map((item) => {
              const resolvedPath = typeof item.path === 'function'
                ? item.path(user?.role ?? '')
                : item.path;

              return (
                <NavLink
                  key={item.label}
                  to={resolvedPath}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;