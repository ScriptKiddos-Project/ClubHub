import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppLayout, AuthLayout, ProtectedRoute } from './components/layout';
import { PageLoader } from './components/ui';

// ── Auth (not lazy — needed immediately)
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import {
  ForgotPasswordPage, ResetPasswordPage,
  VerifyEmailPage,   CoreJoinPage,
} from './pages/auth/OtherAuthPages';

// ── Student (lazy-loaded)
const DashboardPage      = lazy(() => import('./pages/student/DashboardPage'));
const EventsPage         = lazy(() => import('./pages/student/EventsPage'));
const EventDetailPage    = lazy(() => import('./pages/student/EventDetailPage'));
const CreateEventPage    = lazy(() => import('./pages/student/CreateEventPage'));
const ClubsPage          = lazy(() => import('./pages/student/ClubsPage'));
const ClubDetailPage     = lazy(() => import('./pages/student/ClubDetailPage'));
const AttendancePage     = lazy(() => import('./pages/student/AttendancePage'));
const AnalyticsPage      = lazy(() => import('./pages/student/AnalyticsPage'));
const ProfilePage        = lazy(() => import('./pages/student/ProfilePage'));
const MessagesPage       = lazy(() => import('./pages/student/MessagesPage'));

// ── Admin (lazy-loaded)
const AdminDashboard     = lazy(() => import('./pages/admin/AdminDashboardPage'));
const SuperAdminPage     = lazy(() => import('./pages/admin/SuperAdminPage'));
const AttendanceReport   = lazy(() => import('./pages/admin/AttendanceReportPage'));
const MemberRosterPage   = lazy(() => import('./pages/admin/MemberRosterPage'));

// ── Misc
import { SettingsPage, ManagementPage, NotFoundPage } from './pages/misc';

const App: React.FC = () => (
  <BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        style: { borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
        success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
        duration: 3500,
      }}
    />
    <Suspense fallback={<PageLoader/>}>
      <Routes>
        {/* ── Auth routes (public) */}
        <Route element={<AuthLayout/>}>
          <Route path="/login"           element={<LoginPage/>}/>
          <Route path="/register"        element={<RegisterPage/>}/>
          <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
          <Route path="/reset-password"  element={<ResetPasswordPage/>}/>
          <Route path="/verify-email"    element={<VerifyEmailPage/>}/>
          <Route path="/core/join"       element={<CoreJoinPage/>}/>
        </Route>

        {/* ── Student routes (requires auth) */}
        <Route element={<ProtectedRoute/>}>
          <Route element={<AppLayout/>}>
            <Route path="/dashboard"            element={<DashboardPage/>}/>
            <Route path="/events"               element={<EventsPage/>}/>
            <Route path="/events/create"        element={<CreateEventPage/>}/>
            <Route path="/events/:id"           element={<EventDetailPage/>}/>
            <Route path="/clubs"                element={<ClubsPage/>}/>
            <Route path="/clubs/:id"            element={<ClubDetailPage/>}/>
            <Route path="/attendance"           element={<AttendancePage/>}/>
            <Route path="/analytics"            element={<AnalyticsPage/>}/>
            <Route path="/profile"              element={<ProfilePage/>}/>
            <Route path="/messages"             element={<MessagesPage/>}/>
            <Route path="/management"           element={<ManagementPage/>}/>
            <Route path="/settings"             element={<SettingsPage/>}/>
          </Route>
        </Route>

        {/* ── Admin routes (secretary / event_manager) */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin', 'secretary', 'event_manager']}/>}>
          <Route element={<AppLayout/>}>
            <Route path="/admin/dashboard"                    element={<AdminDashboard/>}/>
            <Route path="/admin/events/:eventId/attendance"   element={<AttendanceReport/>}/>
            <Route path="/admin/members"                      element={<MemberRosterPage/>}/>
          </Route>
        </Route>

        {/* ── Super Admin only */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']}/>}>
          <Route element={<AppLayout/>}>
            <Route path="/admin/super"  element={<SuperAdminPage/>}/>
          </Route>
        </Route>

        {/* ── Fallbacks */}
        <Route path="/"  element={<Navigate to="/dashboard" replace/>}/>
        <Route path="*"  element={<NotFoundPage/>}/>
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
