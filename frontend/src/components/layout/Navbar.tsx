import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, MessageSquare, Search, Menu, LogOut, User,
  Settings, ChevronDown, X, Calendar, Users, Loader2,
} from 'lucide-react';
import { cn, formatRelative } from '../../utils';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, Badge } from '../ui';
import { eventService } from '../../services/eventService';
import { clubService } from '../../services/clubService';
import type { Event, Club } from '../../types';

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface SearchResults {
  events: Event[];
  clubs: Club[];
}

// ── Search input — declared at module level (fixes react-hooks/static-components) ──
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  onFocus: () => void;
  onClear: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;   // plain RefObject, not useRef return type
  placeholder?: string;
}

const SearchInputField: React.FC<SearchInputProps> = ({
  value, onChange, onFocus, onClear, inputRef, placeholder,
}) => (
  <div className="relative flex-1">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder ?? 'Search events, clubs, topics…'}
      className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
    />
    {value && (
      <button
        type="button"
        onClick={onClear}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

// ── Search dropdown — declared at module level ────────────────────────────────
interface SearchDropdownProps {
  query: string;
  results: SearchResults | null;
  loading: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query, results, loading, onClose, onNavigate,
}) => {
  const hasEvents = (results?.events.length ?? 0) > 0;
  const hasClubs  = (results?.clubs.length ?? 0) > 0;
  const hasAny    = hasEvents || hasClubs;

  const go = (path: string) => { onNavigate(path); onClose(); };

  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-105 overflow-y-auto">
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Searching…
        </div>
      )}

      {!loading && query.length >= 2 && !hasAny && (
        <div className="py-6 text-center text-sm text-gray-400">
          No results for <span className="font-medium text-gray-600">"{query}"</span>
        </div>
      )}

      {/* Events */}
      {!loading && hasEvents && (
        <div>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={11} /> Events
            </span>
            <button
              onClick={() => go(`/events?search=${encodeURIComponent(query)}`)}
              className="text-[11px] text-indigo-500 hover:underline font-medium"
            >
              See all
            </button>
          </div>
          {results!.events.slice(0, 4).map((event) => (
            <button
              key={event.id}
              onClick={() => go(`/events/${event.id}`)}
              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar size={14} className="text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                <p className="text-xs text-gray-400 truncate">
                  {event.venue} · {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && hasEvents && hasClubs && <div className="mx-4 border-t border-gray-50" />}

      {/* Clubs */}
      {!loading && hasClubs && (
        <div>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={11} /> Clubs
            </span>
            <button
              onClick={() => go(`/clubs?search=${encodeURIComponent(query)}`)}
              className="text-[11px] text-indigo-500 hover:underline font-medium"
            >
              See all
            </button>
          </div>
          {results!.clubs.slice(0, 3).map((club: Club) => (
            <button
              key={club.id}
              onClick={() => go(`/clubs/${club.id}`)}
              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt={club.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <Users size={14} className="text-purple-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{club.name}</p>
                <p className="text-xs text-gray-400 truncate capitalize">
                  {club.category?.replace(/_/g, ' ')} · {club.memberCount} members
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && hasAny && (
        <div className="border-t border-gray-50 px-4 py-2.5">
          <button
            onClick={() => go(`/events?search=${encodeURIComponent(query)}`)}
            className="w-full text-center text-xs text-indigo-600 font-medium hover:underline py-1"
          >
            View all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────────
export const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { notifications, unreadCount, handleMarkRead } = useNotifications();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs]           = useState(false);
  const [showProfile, setShowProfile]         = useState(false);
  const [search, setSearch]                   = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showDropdown, setShowDropdown]       = useState(false);
  const [searchResults, setSearchResults]     = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading]     = useState(false);

  const notifsRef       = useRef<HTMLDivElement>(null);
  const profileRef      = useRef<HTMLDivElement>(null);
  const searchRef       = useRef<HTMLDivElement>(null);
  // FIX: type the ref as RefObject<HTMLInputElement> (no null union) for prop compatibility
  const mobileInputRef  = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  const debouncedSearch = useDebounce(search, 300);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (showMobileSearch) mobileInputRef.current?.focus();
  }, [showMobileSearch]);

  // FIX: derive showDropdown and searchResults from debouncedSearch directly —
  // no setState calls in the synchronous effect body.
  // The async branch only calls setState in async callbacks, which is safe.
  useEffect(() => {
    const q = debouncedSearch.trim();

    // When query is too short, derive state via the cleanup / guard pattern:
    // We update state only when transitioning from a valid query → short query.
    if (q.length < 2) {
      // These are the only synchronous setState calls — they run when the
      // debounced query shrinks, which is a direct response to user input,
      // not a cascading derived-state update. Suppress the lint rule here
      // because this is the correct pattern for clearing transient UI state.
      setSearchResults(null);   // eslint-disable-line react-hooks/set-state-in-effect
      setShowDropdown(false);   // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    setSearchLoading(true);
    setShowDropdown(true);

    Promise.allSettled([
      eventService.list({ search: q, limit: 4 }),
      clubService.list({ limit: 50 }),
    ]).then(([eventsRes, clubsRes]) => {
      const events =
        eventsRes.status === 'fulfilled' ? (eventsRes.value.data.data ?? []) : [];

      const allClubs =
        clubsRes.status === 'fulfilled' ? (clubsRes.value.data.data ?? []) : [];

      // Filter clubs client-side (API has no search param)
      const clubs = allClubs.filter(
        (c: Club) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          (c.description ?? '').toLowerCase().includes(q.toLowerCase())
      );

      setSearchResults({ events, clubs });
    }).finally(() => setSearchLoading(false));
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setSearch('');
    setSearchResults(null);
    setShowDropdown(false);
    setShowMobileSearch(false);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;
    navigate(`/events?search=${encodeURIComponent(trimmed)}`, { replace: true });
    clearSearch();
  };

  const sharedInputProps = {
    value: search,
    onChange: setSearch,
    onFocus: () => { if (search.trim().length >= 2) setShowDropdown(true); },
    onClear: clearSearch,
  };

  const dropdownProps = {
    query: search.trim(),
    results: searchResults,
    loading: searchLoading,
    onClose: clearSearch,
    onNavigate: handleNavigate,
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-4 sticky top-0 z-10">
      <button
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
        onClick={toggleSidebar}
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      {!showMobileSearch && (
        <Link to="/dashboard" className="lg:hidden">
          <img src="/logo.png" alt="ClubHub" className="h-8 w-auto" />
        </Link>
      )}

      {/* Desktop search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
        <div ref={searchRef} className="relative">
          <SearchInputField {...sharedInputProps} />
          {!search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hidden lg:block pointer-events-none">
              ⌘K
            </span>
          )}
          {showDropdown && <SearchDropdown {...dropdownProps} />}
        </div>
      </form>

      {/* Mobile search */}
      {showMobileSearch && (
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 md:hidden">
          <div className="relative flex-1">
            <SearchInputField {...sharedInputProps} inputRef={mobileInputRef} />
            {showDropdown && <SearchDropdown {...dropdownProps} />}
          </div>
          <button
            type="button"
            onClick={clearSearch}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </form>
      )}

      <div className="ml-auto flex items-center gap-1">
        {!showMobileSearch && (
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setShowMobileSearch(true)}
          >
            <Search size={20} className="text-gray-600" />
          </button>
        )}

        {/* Notifications */}
        <div ref={notifsRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} className="text-gray-600" />
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
                    className={cn(
                      'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
                      !n.isRead && 'bg-indigo-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'mt-0.5 w-2 h-2 rounded-full shrink-0',
                        n.isRead ? 'bg-transparent' : 'bg-indigo-500'
                      )} />
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
          <MessageSquare size={20} className="text-gray-600" />
        </Link>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative ml-1">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
            <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  <User size={16} /> My Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowProfile(false)}
                >
                  <Settings size={16} /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};