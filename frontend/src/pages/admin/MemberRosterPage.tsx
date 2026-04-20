import React, { useState } from 'react';
import { Search, UserPlus, Mail, Shield, ChevronDown, Download } from 'lucide-react';
import { Card, Badge, Avatar } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui';
import { Input, Select } from '../../components/ui/Input';
import { cn } from '../../utils';
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

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Marcus Thorne',   email: 'marcus@campus.edu',  dept: 'Computer Science', role: 'event_manager', points: 2450, eventsAttended: 18, joinedAt: 'Aug 2023' },
  { id: '2', name: 'Priya Sharma',    email: 'priya@campus.edu',   dept: 'Data Science',     role: 'secretary',     points: 1820, eventsAttended: 14, joinedAt: 'Sep 2023' },
  { id: '3', name: 'James Wu',        email: 'james@campus.edu',   dept: 'Software Eng.',    role: 'member',        points: 980,  eventsAttended: 8,  joinedAt: 'Oct 2023' },
  { id: '4', name: 'Aisha Okonkwo',   email: 'aisha@campus.edu',   dept: 'Physics',          role: 'member',        points: 750,  eventsAttended: 6,  joinedAt: 'Oct 2023' },
  { id: '5', name: 'Carlos Mendez',   email: 'carlos@campus.edu',  dept: 'Business',         role: 'member',        points: 420,  eventsAttended: 4,  joinedAt: 'Nov 2023' },
  { id: '6', name: 'Sarah Miller',    email: 'sarah@campus.edu',   dept: 'Mathematics',      role: 'member',        points: 610,  eventsAttended: 5,  joinedAt: 'Nov 2023' },
  { id: '7', name: 'Alex Rivera',     email: 'alex@campus.edu',    dept: 'AI & ML',          role: 'member',        points: 1100, eventsAttended: 9,  joinedAt: 'Sep 2023' },
  { id: '8', name: 'Jordan Lee',      email: 'jordan@campus.edu',  dept: 'Cybersecurity',    role: 'member',        points: 890,  eventsAttended: 7,  joinedAt: 'Oct 2023' },
];

const ROLE_CONFIG: Record<MemberRole, { label: string; variant: 'success' | 'warning' | 'primary' }> = {
  secretary:     { label: 'Secretary',     variant: 'success' },
  event_manager: { label: 'Event Manager', variant: 'warning' },
  member:        { label: 'Member',        variant: 'primary' },
};

const MemberRosterPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'events'>('name');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('member');
  const [sendingInvite, setSendingInvite] = useState(false);

  const filtered = members
    .filter((m) => {
      const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || m.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === 'points') return b.points - a.points;
      if (sortBy === 'events') return b.eventsAttended - a.eventsAttended;
      return a.name.localeCompare(b.name);
    });

  const handleRoleChange = (memberId: string, newRole: MemberRole) => {
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
    toast.success('Role updated successfully');
  };

  const handleRemove = (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the club?`)) return;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success(`${name} removed from club`);
  };

  const handleInvite = async () => {
    if (!inviteEmail.includes('@')) { toast.error('Enter a valid email'); return; }
    setSendingInvite(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSendingInvite(false);
    setShowInviteModal(false);
    setInviteEmail('');
    toast.success(`Invitation sent to ${inviteEmail}!`);
  };

  const handleExport = () => {
    const csv = ['Name,Email,Department,Role,Points,Events Attended,Joined'].join('\n') + '\n' +
      members.map((m) => [m.name, m.email, m.dept, m.role, m.points, m.eventsAttended, m.joinedAt].join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'member-roster.csv';
    a.click();
    toast.success('Roster exported!');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Roster</h1>
          <p className="text-sm text-gray-500 mt-1">AI Research Club · {members.length} members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download size={14}/>} onClick={handleExport}>Export</Button>
          <Button size="sm" leftIcon={<UserPlus size={14}/>} onClick={() => setShowInviteModal(true)}>Invite Member</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: members.length },
          { label: 'Event Managers', value: members.filter((m) => m.role === 'event_manager').length },
          { label: 'Secretaries', value: members.filter((m) => m.role === 'secretary').length },
          { label: 'Avg Points', value: Math.round(members.reduce((s, m) => s + m.points, 0) / members.length) },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-2xl font-black text-indigo-600">{s.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
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

      {/* Member table */}
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
                      <Avatar name={member.name} size="sm"/>
                      <div>
                        <p className="font-semibold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{member.dept}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as MemberRole)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="member">Member</option>
                      <option value="secretary">Secretary</option>
                      <option value="event_manager">Event Manager</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-indigo-600">{member.points.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{member.eventsAttended}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{member.joinedAt}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors" title="Send email">
                        <Mail size={14}/>
                      </button>
                      <button
                        onClick={() => handleRemove(member.id, member.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors text-xs font-medium"
                        title="Remove member"
                      >
                        Remove
                      </button>
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

      {/* Invite Modal */}
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
          <Select
            label="Assign Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as MemberRole)}
            options={[
              { value: 'member', label: 'Member' },
              { value: 'secretary', label: 'Secretary' },
              { value: 'event_manager', label: 'Event Manager' },
            ]}
          />
          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
            <Shield size={12} className="inline mr-1"/> Invite will be sent via email. The recipient must register before they can join.
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
