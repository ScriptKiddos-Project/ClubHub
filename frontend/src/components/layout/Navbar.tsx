import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Search, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { cn, formatRelative } from '../../utils';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, Badge } from '../ui';



export const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { notifications, unreadCount, handleMarkRead } = useNotifications();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState('');
  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) { navigate(`/events?search=${encodeURIComponent(search)}`); setSearch(''); }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-4 sticky top-0 z-10">
      <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors" onClick={toggleSidebar}>
        <Menu size={20} className="text-gray-600"/>
      </button>

      {/* Logo on mobile */}
      <Link to="/dashboard" className="lg:hidden">
  <img src="/logo.png" alt="ClubHub" className="h-8 w-auto" />
</Link>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, clubs, or topics..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hidden lg:block">⌘K</span>
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} className="text-gray-600"/>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && <Badge variant="primary">{unreadCount} new</Badge>}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">No notifications</p>
                ) : notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={cn('px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors', !n.isRead && 'bg-indigo-50/50')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5 w-2 h-2 rounded-full shrink-0', n.isRead ? 'bg-transparent' : 'bg-indigo-500')}/>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <Link to="/messages" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <MessageSquare size={20} className="text-gray-600"/>
        </Link>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative ml-1">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Avatar src={user?.avatarUrl} name={user?.name} size="sm"/>
            <ChevronDown size={14} className="text-gray-500 hidden sm:block"/>
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowProfile(false)}>
                  <User size={16}/> My Profile
                </Link>
                <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setShowProfile(false)}>
                  <Settings size={16}/> Settings
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={16}/> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
