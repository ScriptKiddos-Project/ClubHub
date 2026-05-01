import React from 'react';
import { Users, BarChart2, Layers, Calendar, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card } from '../../components/ui';
import { useGlobalAnalytics } from '../../hooks/useAnalytics';

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

const LoadingSkeleton: React.FC = () => (
  <div className="p-6 max-w-6xl mx-auto space-y-6">
    <div className="space-y-1"><Sk className="h-7 w-52" /><Sk className="h-4 w-64" /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <Sk key={i} className="h-24" />)}
    </div>
    <Sk className="h-80" />
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

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const AdminAnalyticsPage: React.FC = () => {
  const { data, loading, error } = useGlobalAnalytics();

  if (loading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error ?? 'No analytics data available.'}</span>
        </div>
      </div>
    );
  }

  const {
    totalUsers       = 0,
    totalClubs       = 0,    // backend field: totalClubs (not activeClubs)
    totalEvents      = 0,    // backend field: totalEvents
    totalAttendance  = 0,
    attendanceRate   = 0,
    topEvents        = [],
  } = data;

  // Chart data: use registration_count (backend field), label as "Registrations"
  const chartData = topEvents.map((e) => ({
    ...e,
    // Provide safe fallback so .toLocaleString() never runs on undefined
    registration_count: e.registration_count ?? 0,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Campus-wide participation overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={22} className="text-indigo-600" />}
          label="Total Users"
          value={totalUsers.toLocaleString()}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Layers size={22} className="text-purple-600" />}
          label="Approved Clubs"
          value={totalClubs.toLocaleString()}
          color="bg-purple-50"
        />
        <StatCard
          icon={<Calendar size={22} className="text-cyan-600" />}
          label="Total Events"
          value={totalEvents.toLocaleString()}
          color="bg-cyan-50"
        />
        <StatCard
          icon={<BarChart2 size={22} className="text-amber-600" />}
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          color="bg-amber-50"
        />
      </div>

      {/* Attendance summary */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-3">Overall Attendance</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${Math.min(attendanceRate, 100)}%` }}
            />
          </div>
          <span className="text-lg font-bold text-indigo-700 shrink-0">{attendanceRate}%</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {totalAttendance.toLocaleString()} total attendances recorded
        </p>
      </Card>

      {/* Top events chart */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Top Events by Registrations</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 py-20 text-center">No event data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 52)}>
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={20}
              margin={{ left: 16, right: 48 }}
            >
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="title"
                width={200}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#374151' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                formatter={(v) => [`${v ?? 0} registrations`, 'Registrations']}
              />
              <Bar dataKey="registration_count" radius={[0, 6, 6, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Top events table */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Event Breakdown</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No events found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Event</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Date</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Registrations</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((ev, i) => (
                  <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="py-3 px-3 text-gray-900 font-medium">{ev.title}</td>
                    <td className="py-3 px-3 text-gray-500">
                      {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-indigo-700">
                      {ev.registration_count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;