import React from 'react';
import { TrendingUp, Calendar, Award, Clock, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '../../components/ui';
import { useStudentStats } from '../../hooks/useAnalytics';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

const LoadingSkeleton: React.FC = () => (
  <div className="p-6 max-w-5xl mx-auto space-y-6">
    <div className="space-y-1">
      <Sk className="h-7 w-40" />
      <Sk className="h-4 w-56" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <Sk key={i} className="h-24" />)}
    </div>
    <Sk className="h-64" />
    <Sk className="h-48" />
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}> = ({ icon, label, value, sub, color }) => (
  <Card className="flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-indigo-600 font-medium mt-0.5">{sub}</p>}
    </div>
  </Card>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const AnalyticsPage: React.FC = () => {
  const { data, loading, error } = useStudentStats();

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error ?? 'No analytics data available yet.'}</span>
        </div>
      </div>
    );
  }

  // These are the EXACT fields returned by normalizeStudentStats in normalizers.ts
  const {
    totalEventsAttended  = 0,
    totalEventsRegistered = 0,
    attendanceRate       = 0,
    total_points         = 0,
    totalVolunteerHours  = 0,
    pointsHistory        = [],
  } = data;

  // Attendance rate as a percentage string
  const attendancePct = attendanceRate > 1
    ? `${Math.round(attendanceRate)}%`      // already 0–100
    : `${Math.round(attendanceRate * 100)}%`; // 0.0–1.0 fraction

  // Format points history dates to something short e.g. "Oct 1"
  const formattedHistory = pointsHistory.map((p) => ({
    ...p,
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Your personal campus activity</p>
      </div>

      {/* ── KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar size={22} className="text-indigo-600" />}
          label="Events Attended"
          value={String(totalEventsAttended)}
          sub={`${totalEventsRegistered} registered`}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<TrendingUp size={22} className="text-purple-600" />}
          label="Attendance Rate"
          value={attendancePct}
          color="bg-purple-50"
        />
        <StatCard
          icon={<Award size={22} className="text-amber-600" />}
          label="Total Points"
          value={total_points.toLocaleString()}
          color="bg-amber-50"
        />
        <StatCard
          icon={<Clock size={22} className="text-green-600" />}
          label="Volunteer Hours"
          value={`${totalVolunteerHours}h`}
          color="bg-green-50"
        />
      </div>

      {/* ── Attendance rate bar */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-3">Attendance Rate</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-indigo-500 transition-all duration-700"
              style={{
                width: `${Math.min(
                  attendanceRate > 1 ? attendanceRate : attendanceRate * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <span className="text-lg font-bold text-indigo-700 shrink-0">{attendancePct}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Attended {totalEventsAttended} of {totalEventsRegistered} registered events
        </p>
      </Card>

      {/* ── Points history */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Points History</h2>
        {formattedHistory.length === 0 ? (
          <p className="text-sm text-gray-400 py-16 text-center">No points history yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={formattedHistory} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                }}
                formatter={(v) => [`${v ?? 0} pts`, 'Points']}
              />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Events summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-bold text-gray-900 mb-2">Events Summary</h2>
          <div className="space-y-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Registered</span>
              <span className="text-sm font-bold text-gray-900">{totalEventsRegistered}</span>
            </div>
            <div className="w-full h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Attended</span>
              <span className="text-sm font-bold text-indigo-700">{totalEventsAttended}</span>
            </div>
            <div className="w-full h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Missed</span>
              <span className="text-sm font-bold text-red-500">
                {Math.max(0, totalEventsRegistered - totalEventsAttended)}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-bold text-gray-900 mb-2">Points & Hours</h2>
          <div className="space-y-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Points</span>
              <span className="text-sm font-bold text-amber-600">{total_points.toLocaleString()}</span>
            </div>
            <div className="w-full h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Volunteer Hours</span>
              <span className="text-sm font-bold text-green-600">{totalVolunteerHours}h</span>
            </div>
            <div className="w-full h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Avg pts / event</span>
              <span className="text-sm font-bold text-gray-900">
                {totalEventsAttended > 0
                  ? Math.round(total_points / totalEventsAttended)
                  : 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;