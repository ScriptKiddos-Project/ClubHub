import React, { useState } from 'react';
import { Users, Calendar, TrendingUp, QrCode, Download, CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Card, Badge, Avatar, ProgressBar } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils';

const ATTENDANCE_DATA = [
  { event: 'AI Symposium', total: 180, present: 156, rate: 87 },
  { event: 'Design Sprint', total: 30, present: 24, rate: 80 },
  { event: 'Hackathon', total: 300, present: 271, rate: 90 },
  { event: 'Vinyl Night', total: 200, present: 189, rate: 95 },
  { event: 'Web3 Mixer', total: 80, present: 62, rate: 78 },
];

const TREND_DATA = [
  { week: 'W1', attendance: 65 }, { week: 'W2', attendance: 72 },
  { week: 'W3', attendance: 68 }, { week: 'W4', attendance: 85 },
  { week: 'W5', attendance: 90 }, { week: 'W6', attendance: 87 },
];

const PENDING_CHECKINS = [
  { name: 'Priya Sharma', email: 'priya@campus.edu', time: '14:02', method: 'QR' },
  { name: 'James Wu', email: 'james@campus.edu', time: '14:04', method: 'PIN' },
  { name: 'Aisha Okonkwo', email: 'aisha@campus.edu', time: '14:06', method: 'Manual' },
];

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeEvent, setActiveEvent] = useState('AI Ethics Symposium');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);

  const handleGenerateQR = async () => {
    setGeneratingQR(true);
    await new Promise((r) => setTimeout(r, 1500));
    setQrGenerated(true);
    setGeneratingQR(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === 'super_admin' ? 'Platform-wide overview' : 'Club management & event operations'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download size={14}/>}>Export Report</Button>
          <Button size="sm" leftIcon={<Calendar size={14}/>}>New Event</Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: '1,284', icon: <Users size={20} className="text-indigo-600"/>, bg: 'bg-indigo-50', sub: '+12 this week' },
          { label: 'Events This Month', value: '18', icon: <Calendar size={20} className="text-purple-600"/>, bg: 'bg-purple-50', sub: '3 ongoing' },
          { label: 'Avg Attendance Rate', value: '86%', icon: <TrendingUp size={20} className="text-green-600"/>, bg: 'bg-green-50', sub: '↑ 4% from last month' },
          { label: 'Pending Approvals', value: '7', icon: <AlertTriangle size={20} className="text-amber-600"/>, bg: 'bg-amber-50', sub: '2 clubs, 5 events' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', s.bg)}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xs text-indigo-600 font-medium">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance table */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Event Attendance Summary</h2>
            <Button size="sm" variant="outline" leftIcon={<Download size={13}/>}>CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2">Event</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase pb-2">Total</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase pb-2">Present</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase pb-2">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ATTENDANCE_DATA.map((row) => (
                  <tr key={row.event} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-900">{row.event}</td>
                    <td className="py-3 text-right text-gray-600">{row.total}</td>
                    <td className="py-3 text-right text-gray-600">{row.present}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 hidden sm:block">
                          <ProgressBar value={row.rate} color={row.rate >= 85 ? 'bg-green-500' : row.rate >= 70 ? 'bg-amber-500' : 'bg-red-500'}/>
                        </div>
                        <span className={cn('font-bold text-xs', row.rate >= 85 ? 'text-green-600' : row.rate >= 70 ? 'text-amber-600' : 'text-red-600')}>
                          {row.rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* QR/PIN Generator */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-3">Live Check-in Control</h2>
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400" value={activeEvent} onChange={(e) => setActiveEvent(e.target.value)}>
            <option>AI Ethics Symposium</option>
            <option>Design Sprint</option>
            <option>Hackathon</option>
          </select>

          {qrGenerated ? (
            <div className="text-center">
              <div className="w-40 h-40 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-3 border-2 border-indigo-200">
                <QrCode size={64} className="text-indigo-600"/>
              </div>
              <p className="text-xs text-gray-500 mb-1">QR Code active — expires in</p>
              <p className="text-2xl font-mono font-bold text-indigo-600">04:58</p>
              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-0.5">Fallback PIN</p>
                <p className="text-2xl font-mono font-bold text-gray-900 tracking-widest">482-917</p>
              </div>
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setQrGenerated(false)}>Regenerate</Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-28 h-28 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                <QrCode size={40} className="text-gray-300"/>
              </div>
              <p className="text-sm text-gray-500 mb-4">Generate a QR code and PIN for live check-in</p>
              <Button className="w-full" onClick={handleGenerateQR} loading={generatingQR} leftIcon={<QrCode size={15}/>}>
                Generate QR + PIN
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance trend chart */}
        <Card>
          <h2 className="font-bold text-gray-900 mb-4">Attendance Trend (6 Weeks)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }}/>
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} domain={[50, 100]}/>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} formatter={(v) => [`${v}%`, 'Attendance']}/>
              <Line type="monotone" dataKey="attendance" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pending check-ins */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Check-ins</h2>
            <Badge variant="danger" dot>Live</Badge>
          </div>
          <div className="space-y-3">
            {PENDING_CHECKINS.map((c) => (
              <div key={c.email} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <Avatar name={c.name} size="sm"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={c.method === 'QR' ? 'primary' : c.method === 'PIN' ? 'success' : 'default'} className="text-xs">{c.method}</Badge>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 justify-end"><Clock size={10}/>{c.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-3" leftIcon={<CheckSquare size={14}/>}>
            View Full Attendance Report
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
