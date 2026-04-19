import React from 'react';
import { TrendingUp, Calendar, Award, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, ProgressBar, Badge } from '../../components/ui';

const MONTHLY_DATA = [
  { month: 'Jul', events: 2, points: 80 }, { month: 'Aug', events: 5, points: 210 },
  { month: 'Sep', events: 3, points: 140 }, { month: 'Oct', events: 7, points: 320 },
  { month: 'Nov', events: 4, points: 190 }, { month: 'Dec', events: 6, points: 280 },
];

const CATEGORY_DATA = [
  { name: 'Technology', value: 40, color: '#6366f1' },
  { name: 'Career Prep', value: 25, color: '#8b5cf6' },
  { name: 'Social', value: 20, color: '#06b6d4' },
  { name: 'Academic', value: 15, color: '#10b981' },
];

const POINTS_HISTORY = [
  { date: 'Oct 1', points: 1800 }, { date: 'Oct 8', points: 2050 },
  { date: 'Oct 15', points: 2100 }, { date: 'Oct 22', points: 2300 },
  { date: 'Oct 29', points: 2450 },
];

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; sub: string; color: string }> = ({ icon, label, value, sub, color }) => (
  <Card className="flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xs text-indigo-600 font-medium mt-0.5">{sub}</p>
    </div>
  </Card>
);

const AnalyticsPage: React.FC = () => (
  <div className="p-6 max-w-6xl mx-auto space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="text-sm text-gray-500 mt-1">Your campus activity at a glance</p>
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={<Calendar size={22} className="text-indigo-600"/>} label="Events Attended" value="27" sub="↑ 4 from last month" color="bg-indigo-50"/>
      <StatCard icon={<TrendingUp size={22} className="text-purple-600"/>} label="Attendance Rate" value="87%" sub="Above campus avg" color="bg-purple-50"/>
      <StatCard icon={<Award size={22} className="text-amber-600"/>} label="Total Points" value="2,450" sub="Gold tier member" color="bg-amber-50"/>
      <StatCard icon={<Clock size={22} className="text-green-600"/>} label="Volunteer Hours" value="34h" sub="8h this semester" color="bg-green-50"/>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Events per month bar chart */}
      <Card className="lg:col-span-2">
        <h2 className="font-bold text-gray-900 mb-4">Events Attended Per Month</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY_DATA} barSize={24}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }}/>
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }}/>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}/>
            <Bar dataKey="events" fill="#6366f1" radius={[6, 6, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Category breakdown */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Event Categories</h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={CATEGORY_DATA} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
              {CATEGORY_DATA.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
            </Pie>
            <Tooltip/>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-2">
          {CATEGORY_DATA.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }}/>
              <span className="text-xs text-gray-600 flex-1">{d.name}</span>
              <span className="text-xs font-bold text-gray-900">{d.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Points history line chart */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Points Growth</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={POINTS_HISTORY}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }}/>
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }}/>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}/>
            <Line type="monotone" dataKey="points" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Skills radar / skill progress */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Skill Development</h2>
        <div className="space-y-4">
          {[
            { name: 'Architecture', pct: 94 }, { name: 'Leadership', pct: 88 },
            { name: 'Public Speaking', pct: 76 }, { name: 'Team Collaboration', pct: 82 },
            { name: 'Problem Solving', pct: 90 },
          ].map((s) => (
            <div key={s.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{s.name}</span>
                <span className="text-indigo-600 font-bold">{s.pct}%</span>
              </div>
              <ProgressBar value={s.pct}/>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

export default AnalyticsPage;
