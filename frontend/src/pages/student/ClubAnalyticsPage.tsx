import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, BarChart2, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Card } from '../../components/ui';
import { useClubAnalytics } from '../../hooks/useAnalytics';

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

const LoadingSkeleton: React.FC = () => (
  <div className="p-6 max-w-5xl mx-auto space-y-6">
    <Sk className="h-5 w-20" />
    <div className="space-y-1"><Sk className="h-7 w-48" /><Sk className="h-4 w-64" /></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => <Sk key={i} className="h-24" />)}
    </div>
    <Sk className="h-72" />
    <Sk className="h-64" />
  </div>
);

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number; color: string;
}> = ({ icon, label, value, color }) => (
  <Card className="flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </Card>
);

const ClubAnalyticsPage: React.FC = () => {
  const { id: clubId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useClubAnalytics(clubId ?? '');

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error ?? 'No analytics data for this club.'}</span>
        </div>
      </div>
    );
  }

  // All field names match the reshaped ClubAnalytics interface in useAnalytics.ts
  const {
    totalMembers        = 0,   // reshaped from raw.memberCount
    totalEvents         = 0,   // raw.totalEvents
    attendanceRate      = 0,   // raw.attendanceRate (0–100 integer)
    memberCountOverTime = [],   // reshaped from raw.memberGrowth
    events              = [],   // raw.events
  } = data;

  const attendancePct = `${Math.min(Math.round(
    attendanceRate > 1 ? attendanceRate : attendanceRate * 100
  ), 100)}%`;

  const attendanceBarWidth = Math.min(
    attendanceRate > 1 ? attendanceRate : attendanceRate * 100,
    100
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Club
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Club Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Membership growth and event performance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users size={22} className="text-indigo-600" />}
          label="Total Members"
          value={totalMembers.toLocaleString()}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Calendar size={22} className="text-purple-600" />}
          label="Events Held"
          value={totalEvents.toLocaleString()}
          color="bg-purple-50"
        />
        <StatCard
          icon={<BarChart2 size={22} className="text-emerald-600" />}
          label="Attendance Rate"
          value={attendancePct}
          color="bg-emerald-50"
        />
      </div>

      {/* Member growth chart */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Member Growth (Last 6 Months)</h2>
        {memberCountOverTime.length === 0 ? (
          <p className="text-sm text-gray-400 py-20 text-center">
            No membership data in the last 6 months
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={memberCountOverTime} margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                formatter={(v) => [`${v ?? 0} new members`, 'New Members']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Attendance rate */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-3">Attendance Rate</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${attendanceBarWidth}%` }}
            />
          </div>
          <span className="text-lg font-bold text-indigo-700 shrink-0">{attendancePct}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Average attendance across {totalEvents} events
        </p>
      </Card>

      {/* Per-event breakdown */}
      {events.length > 0 && (
        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Registrations per Event</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, events.length * 40)}>
            <BarChart
              data={events}
              layout="vertical"
              barSize={16}
              margin={{ left: 16, right: 48 }}
            >
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="title"
                width={180}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#374151' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                formatter={(v) => [`${v ?? 0}`, 'Registrations']}
              />
              <Bar dataKey="registration_count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
};

export default ClubAnalyticsPage;