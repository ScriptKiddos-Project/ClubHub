import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, Shield, Download, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Card, Avatar } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

type MemberRole = 'member' | 'secretary' | 'event_manager';

interface Member {
  id: string;
  name: string;
  email: string;
  dept: string;
  role: MemberRole;
  points: number;
  eventsAttended: number;
  joinedAt: string;
  avatarUrl?: string;
}

interface RawMember {
  id?: string;
  userId?: string;
  role?: string;
  joinedAt?: string;
  attendanceCount?: number;
  eventsAttended?: number;
  user?: {
    name?: string;
    email?: string;
    department?: string;
    avatarUrl?: string;
    points?: number;
    total_points?: number;
  };
  name?: string;
  email?: string;
  department?: string;
  dept?: string;
  avatarUrl?: string;
  points?: number;
}

interface MembersPayload {
  members?: RawMember[];
  club?: { name?: string };
}

interface ClubItem {
  id: string;
  name?: string;
  isJoined?: boolean;
}

interface ApiErr {
  response?: { data?: { message?: string } };
}

const resolveClubId = async (userId: string): Promise<{ id: string; name: string }> => {
  try {
    const res = await api.get<{ data: ClubItem[] }>('/clubs/my');
    const list = res.data?.data ?? [];
    if (list.length > 0) return { id: list[0].id, name: list[0].name ?? '' };
  } catch { /* endpoint may not exist */ }

  try {
    const res = await api.get<{ data: ClubItem[] }>(`/clubs?memberId=${userId}`);
    const list = res.data?.data ?? [];
    if (list.length > 0) return { id: list[0].id, name: list[0].name ?? '' };
  } catch { /* fallback */ }

  const res = await api.get<{ data: ClubItem[] }>('/clubs');
  const all = res.data?.data ?? [];
  const joined = all.filter((c) => c.isJoined);
  if (joined.length > 0) return { id: joined[0].id, name: joined[0].name ?? '' };

  return { id: '', name: '' };
};

const MemberRosterPage: React.FC = () => {
  const { clubId: clubIdParam } = useParams<{ clubId?: string }>();
  const { user } = useAuthStore();

  // Derive whether the current user is a super_admin.
  // secretaries and event_managers cannot change roles or send invites.
  const isSuperAdmin = user?.role === 'super_admin';

  const [clubId, setClubId] = useState(clubIdParam ?? '');
  const [clubName, setClubName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'events'>('name');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Resolve clubId if not in URL
  useEffect(() => {
    if (clubIdParam) { setClubId(clubIdParam); return; }
    if (!user) return;
    resolveClubId(user.id)
      .then(({ id, name }) => { setClubId(id); if (name) setClubName(name); })
      .catch(() => setLoading(false));
  }, [clubIdParam, user]);

  // Fetch members
  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    api.get<{ data: MembersPayload | RawMember[] }>(`/clubs/${clubId}/members`)
      .then((res) => {
        const payload = res.data?.data;
        let raw: RawMember[] = [];
        if (Array.isArray(payload)) {
          raw = payload;
        } else if (payload && 'members' in payload && Array.isArray(payload.members)) {
          raw = payload.members;
          if (payload.club?.name) setClubName(payload.club.name);
        }
        setMembers(raw.map((m): Member => ({
          id:             m.id ?? m.userId ?? '',
          name:           m.user?.name ?? m.name ?? 'Unknown',
          email:          m.user?.email ?? m.email ?? '',
          dept:           m.user?.department ?? m.department ?? m.dept ?? '—',
          role:           (m.role as MemberRole) ?? 'member',
          points:         m.user?.total_points ?? m.user?.points ?? m.points ?? 0,
          eventsAttended: m.eventsAttended ?? m.attendanceCount ?? 0,
          joinedAt:       m.joinedAt
            ? new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : '—',
          avatarUrl: m.user?.avatarUrl ?? m.avatarUrl,
        })));
      })
      .catch((err: ApiErr) => toast.error(err?.response?.data?.message ?? 'Failed to load members'))
      .finally(() => setLoading(false));
  }, [clubId]);

  const filtered = members
    .filter((m) => {
      const q = search.toLowerCase();
      return (
        (!search || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) &&
        (roleFilter === 'all' || m.role === roleFilter)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'points') return b.points - a.points;
      if (sortBy === 'events') return b.eventsAttended - a.eventsAttended;
      return a.name.localeCompare(b.name);
    });

  // Only super_admin can change roles
  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      await api.patch(`/clubs/${clubId}/members/${memberId}/role`, { role: newRole });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      toast.success('Role updated');
    } catch (err: unknown) {
      toast.error((err as ApiErr)?.response?.data?.message ?? 'Failed to update role');
    }
  };

  // Only super_admin can remove members
  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the club?`)) return;
    try {
      await api.delete(`/clubs/${clubId}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success(`${name} removed`);
    } catch (err: unknown) {
      toast.error((err as ApiErr)?.response?.data?.message ?? 'Failed to remove member');
    }
  };

  // Invite always sends as member — role select removed from modal
  const handleInvite = async () => {
    if (!inviteEmail.includes('@')) { toast.error('Enter a valid email'); return; }
    setSendingInvite(true);
    try {
      await api.post(`/clubs/${clubId}/members/invite`, { email: inviteEmail });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err: unknown) {
      toast.error((err as ApiErr)?.response?.data?.message ?? 'Failed to send invite');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleExport = () => {
    const rows = [
      'Name,Email,Department,Role,Points,Events Attended,Joined',
      ...members.map((m) =>
        [m.name, m.email, m.dept, m.role, m.points, m.eventsAttended, m.joinedAt].join(','),
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'member-roster.csv';
    a.click();
    toast.success('Roster exported!');
  };

  if (!clubId && !loading) {
    return <div className="p-6 text-center text-gray-500">No club found. Please navigate from a specific club page.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Roster</h1>
          <p className="text-sm text-gray-500 mt-1">{clubName || 'Your Club'} · {loading ? '…' : `${members.length} members`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download size={14}/>} onClick={handleExport} disabled={loading}>
            Export
          </Button>
          {/* Only super_admin sees the Invite button */}
          {isSuperAdmin && (
            <Button size="sm" leftIcon={<UserPlus size={14}/>} onClick={() => setShowInviteModal(true)} disabled={loading}>
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={20}/> Loading members…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Members',  value: members.length },
              { label: 'Event Managers', value: members.filter((m) => m.role === 'event_manager').length },
              { label: 'Secretaries',    value: members.filter((m) => m.role === 'secretary').length },
              { label: 'Avg Points',     value: members.length ? Math.round(members.reduce((s, m) => s + m.points, 0) / members.length) : 0 },
            ].map((s) => (
              <Card key={s.label} className="text-center">
                <p className="text-2xl font-black text-indigo-600">{s.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            </div>
            <div className="flex gap-1.5">
              {(['all', 'member', 'secretary', 'event_manager'] as const).map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border',
                    roleFilter === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300')}>
                  {r === 'all' ? 'All' : r.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 ml-auto">
              Sort:
              {(['name', 'points', 'events'] as const).map((s) => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                    sortBy === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Card noPad>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Member', 'Department', 'Role', 'Points', 'Events', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} size="sm" src={member.avatarUrl}/>
                          <div>
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-400">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{member.dept}</td>
                      <td className="px-5 py-3.5">
                        {/* Role dropdown: only super_admin can change roles.
                            Secretaries and event_managers see a plain text badge. */}
                        {isSuperAdmin ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as MemberRole)}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            <option value="member">Member</option>
                            <option value="secretary">Secretary</option>
                            <option value="event_manager">Event Manager</option>
                          </select>
                        ) : (
                          <span className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize',
                            member.role === 'secretary'     && 'bg-purple-50 text-purple-700',
                            member.role === 'event_manager' && 'bg-blue-50 text-blue-700',
                            member.role === 'member'        && 'bg-gray-100 text-gray-600',
                          )}>
                            {member.role.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5"><span className="font-bold text-indigo-600">{member.points.toLocaleString()}</span></td>
                      <td className="px-5 py-3.5 text-gray-600">{member.eventsAttended}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{member.joinedAt}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Send email"
                            onClick={() => window.open(`mailto:${member.email}`)}
                          >
                            <Mail size={14}/>
                          </button>
                          {/* Remove button only for super_admin */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRemove(member.id, member.name)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors text-xs font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-gray-500 py-8">No members match your search</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Invite modal — role select removed, always invites as member */}
      <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite New Member" size="sm">
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="student@campus.edu"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            leftIcon={<Mail size={16}/>}
          />
          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
            <Shield size={12} className="inline mr-1"/>
            The user will be added as a <strong>member</strong> and notified by email.
            They must already have a ClubHub account.
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button onClick={handleInvite} loading={sendingInvite} leftIcon={<Mail size={14}/>}>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberRosterPage;