import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../../services/api';
import { TrendingUp, Users, Calendar, Star } from 'lucide-react';
import { MemberEngagementTable } from './MemberEngagementTable';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

interface ClubAnalyticsData {
  summary: {
    totalEvents: number;
    totalRegistrations: number;
    totalAttended: number;
    engagementRate: number;
    eventSuccessRate: number;
    dropOffRate: number;
    avgFeedbackScore: number | null;
  };
  memberGrowth: { month: string; count: number }[];
  eventBreakdown: {
    id: string;
    title: string;
    date: string;
    registrations: number;
    attended: number;
    late: number;
    absent: number;
  }[];
}

interface Props {
  clubId: string;
}

export function ClubAnalyticsDashboard({ clubId }: Props) {
  const [data, setData] = useState<ClubAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'members'>('overview');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/clubs/${clubId}/analytics`);
        setData(res.data.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [clubId]);

  if (isLoading) {
    return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted" />)}</div>;
  }

  if (!data) return null;

  const { summary } = data;

  // Pie chart data for attendance breakdown
  const attendancePie = [
    { name: 'Attended', value: summary.totalAttended },
    { name: 'Absent', value: summary.totalRegistrations - summary.totalAttended },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="h-5 w-5 text-purple-500" />} label="Total Events" value={summary.totalEvents} />
        <StatCard icon={<Users className="h-5 w-5 text-cyan-500" />} label="Engagement Rate" value={`${summary.engagementRate}%`} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-green-500" />} label="Event Success Rate" value={`${summary.eventSuccessRate}%`} />
        <StatCard icon={<Star className="h-5 w-5 text-amber-500" />} label="Avg Feedback" value={summary.avgFeedbackScore ? `${summary.avgFeedbackScore.toFixed(1)} / 5` : 'N/A'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['overview', 'events', 'members'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Growth Line Chart */}
          <ChartCard title="Member Growth">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.memberGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Attendance Breakdown Pie */}
          <ChartCard title="Attendance Breakdown">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {attendancePie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {activeTab === 'events' && (
        <ChartCard title="Registrations vs Attendance per Event">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.eventBreakdown.slice(0, 10)} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="title"
                tick={{ fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="registrations" fill="#8b5cf6" name="Registered" radius={[4, 4, 0, 0]} />
              <Bar dataKey="attended" fill="#10b981" name="Attended" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {activeTab === 'members' && (
        <MemberEngagementTable clubId={clubId} />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <div className="rounded-lg bg-muted p-2">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}