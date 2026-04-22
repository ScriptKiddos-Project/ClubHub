import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { PageLoader } from '../ui';
import type { UserRole } from '../../types';

// ─── MAIN LAYOUT ─────────────────────────────────────────────────────────────
export const AppLayout: React.FC = () => (
  <div className="flex h-screen bg-gray-50 overflow-hidden">
    <Sidebar/>
    <div className="flex flex-col flex-1 overflow-hidden">
      <Navbar/>
      <main className="flex-1 overflow-y-auto">
        <Outlet/>
      </main>
    </div>
  </div>
);

// ─── PROTECTED ROUTE ──────────────────────────────────────────────────────────
interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, login, setLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Only attempt refresh once on initial mount
    if (!isAuthenticated && isLoading) {
      authService.refresh()
        .then(async ({ data }) => {
          const token = data.data.accessToken;
          try {
            const userRes = await authService.getMe();
            login(userRes.data.data, token);
          } catch {
            // getMe failed — clear loading so login page shows
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  if (isLoading) return <PageLoader/>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace/>;
  if (allowedRoles) {
    const { user } = useAuthStore.getState();
    if (user && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace/>;
  }
  return <Outlet/>;
};

// ─── AUTH LAYOUT (centered card) ─────────────────────────────────────────────
export const AuthLayout: React.FC = () => (
  <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex">
    {/* Left brand panel - hidden on mobile */}
    <div
      className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f0c29, #1a1560, #24243e)' }}
    >
      {/* Gold radial glow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.08) 0%, transparent 70%)' }}/>
      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}/>
      {/* Bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}/>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo */}
        <img src="/logo.png" alt="ClubHub" className="w-44 h-44 object-contain drop-shadow-2xl mb-8" />

        {/* Gold divider with Est. */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C)' }}/>
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: '#C9A84C' }}>Est. 2025</span>
          <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, #C9A84C, transparent)' }}/>
        </div>

        <h1
          className="text-4xl font-light text-white leading-snug tracking-wide mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
         All your clubs, events,<br/>
<span style={{ color: '#C9A84C' }}>and points all in</span><br/>
<span className="text-white">one place.</span>
        </h1>
      </div>
    </div>

    {/* Right form panel */}
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Outlet/>
      </div>
    </div>
  </div>
);