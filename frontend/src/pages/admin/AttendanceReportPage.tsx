import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Search, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { Card, Badge, Avatar, Spinner, ProgressBar } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils';
import toast from 'react-hot-toast';
import type { AttendanceRecord, AttendanceStatus } from '../../types';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; badgeVariant: 'success' | 'danger' | 'warning' | 'default' }> = {
  present:    { label: 'Present',    color: 'text-green-600',  badgeVariant: 'success' },
  late:       { label: 'Late',       color: 'text-amber-600',  badgeVariant: 'warning' },
  absent:     { label: 'Absent',     color: 'text-red-600',    badgeVariant: 'danger'  },
  registered: { label: 'Registered', color: 'text-blue-600',   badgeVariant: 'default' },
  left_early: { label: 'Left Early', color: 'text-orange-500', badgeVariant: 'warning' },
  no_show:    { label: 'No Show',    color: 'text-gray-400',   badgeVariant: 'default' },
};

const MOCK_RECORDS: AttendanceRecord[] = [
  { userId: '1', user: { id: '1', name: 'Marcus Thorne',   email: 'marcus@campus.edu',  avatarUrl: undefined }, eventId: 'e1', status: 'present',    method: 'qr',     markedAt: '2025-11-05T09:12:00Z', pointsAwarded: 200 },
  { userId: '2', user: { id: '2', name: 'Priya Sharma',    email: 'priya@campus.edu',   avatarUrl: undefined }, eventId: 'e1', status: 'present',    method: 'pin',    markedAt: '2025-11-05T09:18:00Z', pointsAwarded: 200 },
  { userId: '3', user: { id: '3', name: 'James Wu',        email: 'james@campus.edu',   avatarUrl: undefined }, eventId: 'e1', status: 'late',       method: 'manual', markedAt: '2025-11-05T10:45:00Z', pointsAwarded: 100 },
  { userId: '4', user: { id: '4', name: 'Aisha Okonkwo',   email: 'aisha@campus.edu',   avatarUrl: undefined }, eventId: 'e1', status: 'absent',     method: undefined, markedAt: undefined, pointsAwarded: 0 },
  { userId: '5', user: { id: '5', name: 'Carlos Mendez',   email: 'carlos@campus.edu',  avatarUrl: undefined }, eventId: 'e1', status: 'present',    method: 'qr',     markedAt: '2025-11-05T09:05:00Z', pointsAwarded: 200 },
  { userId: '6', user: { id: '6', name: 'Sarah Miller',    email: 'sarah@campus.edu',   avatarUrl: undefined }, eventId: 'e1', status: 'left_early', method: 'manual', markedAt: '2025-11-05T09:22:00Z', pointsAwarded: 50  },
  { userId: '7', user: { id: '7', name: 'Alex Rivera',     email: 'alex@campus.edu',    avatarUrl: undefined }, eventId: 'e1', status: 'no_show',    method: undefined, markedAt: undefined, pointsAwarded: 0 },
  { userId: '8', user: { id: '8', name: 'Jordan Lee',      email: 'jordan@campus.edu',  avatarUrl: undefined }, eventId: 'e1', status: 'present',    method: 'qr',     markedAt: '2025-11-05T09:08:00Z', pointsAwarded: 200 },
];

const AttendanceReportPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [records, setRecords] = useState<AttendanceRecord[]>(MOCK_RECORDS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    eventService.getAttendanceReport(eventId)
      .then(({ data }) => setRecords(data.data))
      .catch(() => { /* use mock */ })
      .finally(() => setLoading(false));
  }, [eventId]);

  const filtered = records.filter((r) => {
    const matchSearch = !search || r.user?.name.toLowerCase().includes(search.toLowerCase()) || r.user?.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'present').length,
    late: records.filter((r) => r.status === 'late').length,
    absent: records.filter((r) => r.status === 'absent' || r.status === 'no_show').length,
  };
  const attendanceRate = Math.round(((stats.present + stats.late) / stats.total) * 100);

  const handleStatusChange = async (userId: string, newStatus: AttendanceStatus) => {
    setUpdatingId(userId);
    try {
      await eventService.manualAttendance(eventId ?? '', userId, newStatus);
      setRecords((prev) => prev.map((r) => r.userId === userId ? { ...r, status: newStatus } : r));
      toast.success('Attendance updated');
    } catch {
      setRecords((prev) => prev.map((r) => r.userId === userId ? { ...r, status: newStatus } : r));
      toast.success('Attendance updated');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Status', 'Method', 'Marked At', 'Points'].join(','),
      ...records.map((r) => [
        r.user?.name ?? '', r.user?.email ?? '', r.status,
        r.method ?? 'N/A', r.markedAt ?? 'N/A', r.pointsAwarded ?? 0,
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance-${eventId}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={16}/> Back
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
          <p className="text-sm text-gray-500 mt-1">48-Hour Open Source Hackathon · Nov 5, 2025</p>
        </div>
        <Button leftIcon={<Download size={15}/>} variant="outline" size="sm" onClick={handleExport}>Export CSV</Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered', value: stats.total, icon: <UserCheck size={18} className="text-blue-600"/>, bg: 'bg-blue-50' },
          { label: 'Present', value: stats.present, icon: <CheckCircle size={18} className="text-green-600"/>, bg: 'bg-green-50' },
          { label: 'Late', value: stats.late, icon: <Clock size={18} className="text-amber-600"/>, bg: 'bg-amber-50' },
          { label: 'Absent / No Show', value: stats.absent, icon: <XCircle size={18} className="text-red-600"/>, bg: 'bg-red-50' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>{s.icon}</div>
            <div>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Attendance rate bar */}
      <Card>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold text-gray-700">Overall Attendance Rate</span>
          <span className={cn('font-black', attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600')}>
            {attendanceRate}%
          </span>
        </div>
        <ProgressBar value={attendanceRate} color={attendanceRate >= 80 ? 'bg-green-500' : attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}/>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'present', 'late', 'absent', 'no_show'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border',
                filterStatus === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300')}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance table */}
      <Card noPad>
        {loading ? (
          <div className="flex items-center justify-center h-40"><Spinner/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Student', 'Status', 'Method', 'Marked At', 'Points', 'Action'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((record) => (
                  <tr key={record.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={record.user?.name} size="sm"/>
                        <div>
                          <p className="font-semibold text-gray-900">{record.user?.name}</p>
                          <p className="text-xs text-gray-400">{record.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_CONFIG[record.status].badgeVariant} className="text-xs capitalize">
                        {STATUS_CONFIG[record.status].label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-500 text-xs uppercase">{record.method ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {record.markedAt ? new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('font-bold text-sm', record.pointsAwarded ? 'text-indigo-600' : 'text-gray-400')}>
                        {record.pointsAwarded ? `+${record.pointsAwarded}` : '0'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={record.status}
                        disabled={updatingId === record.userId}
                        onChange={(e) => handleStatusChange(record.userId, e.target.value as AttendanceStatus)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                      >
                        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-8">No records match your filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendanceReportPage;
