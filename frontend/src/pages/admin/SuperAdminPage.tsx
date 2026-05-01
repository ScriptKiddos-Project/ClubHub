import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, CheckCircle, XCircle, Clock,
  Megaphone, Plus, Send, Loader2, Edit2, Key, Eye,
  ShieldOff,
} from 'lucide-react';
import { clubService } from '../../services/clubService';
import {
  adminService,
  type CommunityItem,
  type AnnouncementItem,
  type CodeUsageEntry,
} from '../../services/adminService';
import { Card, Badge } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils';
import toast from 'react-hot-toast';
import type { Club } from '../../types';
import { SuperAdminUsersTab } from './SuperAdminUsersTab';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const categoryLabel: Record<string, string> = {
  technology: 'Technology', arts_culture: 'Arts & Culture', sports: 'Sports',
  academic: 'Academic', social: 'Social', career_prep: 'Career Prep',
  development: 'Development', creative_arts: 'Creative Arts',
};

const CLUB_CATEGORIES = [
  'technology', 'arts_culture', 'sports', 'academic',
  'social', 'career_prep', 'development', 'creative_arts',
];

const ROLES = ['member', 'secretary', 'event_manager'];

// ─── Club Approvals Tab ───────────────────────────────────────────────────────

const ClubApprovalsTab: React.FC<{
  pendingClubs: Club[];
  processing: string | null;
  onApprove: (id: string, approved: boolean) => void;
}> = ({ pendingClubs, processing, onApprove }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-500">Review and approve club registration requests submitted by students.</p>
    {pendingClubs.length === 0 ? (
      <Card className="text-center py-12">
        <CheckCircle size={40} className="text-green-500 mx-auto mb-3"/>
        <h3 className="font-bold text-gray-900">All caught up!</h3>
        <p className="text-sm text-gray-500 mt-1">No pending club approvals</p>
      </Card>
    ) : (
      pendingClubs.map((club) => (
        <Card key={club.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl shrink-0">
                {club.name[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">{club.name}</h3>
                  <Badge variant="warning" className="text-xs flex items-center gap-1"><Clock size={10}/> Pending</Badge>
                  <span className="text-xs text-gray-500 capitalize">{categoryLabel[club.category] ?? club.category}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{club.description}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="danger" loading={processing === club.id} leftIcon={<XCircle size={14}/>} onClick={() => onApprove(club.id, false)}>Reject</Button>
              <Button size="sm" loading={processing === club.id} leftIcon={<CheckCircle size={14}/>} onClick={() => onApprove(club.id, true)}>Approve</Button>
            </div>
          </div>
        </Card>
      ))
    )}
  </div>
);

// ─── All Clubs Tab ────────────────────────────────────────────────────────────

const AllClubsTab: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('technology');

  const loadClubs = () => {
    setLoading(true);
    adminService.listAllClubs()
      .then((res) => setClubs(res.data.data ?? []))
      .catch(() =>
        clubService.list()
          .then((res) => setClubs(res.data.data ?? []))
          .catch(() => toast.error('Failed to load clubs'))
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClubs(); }, []);

  const openEdit = (club: Club) => {
    setEditingClub(club);
    setEditName(club.name);
    setEditDesc(club.description ?? '');
    setEditCategory(club.category ?? '');
  };

  const handleUpdate = () => {
    if (!editingClub) return;
    setSaving(true);
    adminService.updateClub(editingClub.id, {
      name: editName,
      description: editDesc,
      category: editCategory as Club['category'],
    })
      .then(() => {
        setClubs((prev) => prev.map((c) => c.id === editingClub.id
          ? { ...c, name: editName, description: editDesc, category: editCategory as Club['category'] }
          : c));
        toast.success('Club updated');
        setEditingClub(null);
      })
      .catch(() => toast.error('Failed to update club'))
      .finally(() => setSaving(false));
  };

  const handleCreate = () => {
    if (!newName.trim()) { toast.error('Club name required'); return; }
    setSaving(true);
    adminService.createClub({ name: newName.trim(), description: newDesc.trim(), category: newCategory as Club['category'] })
      .then((res) => {
        setClubs((prev) => [res.data.data as Club, ...prev]);
        toast.success('Club created!');
        setShowCreate(false);
        setNewName(''); setNewDesc(''); setNewCategory('technology');
      })
      .catch(() => toast.error('Failed to create club'))
      .finally(() => setSaving(false));
  };

  const statusVariant = (status: string): 'success' | 'warning' | 'default' =>
    status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default';

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"/>)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{clubs.length} clubs total</p>
        <Button size="sm" leftIcon={<Plus size={14}/>} onClick={() => setShowCreate(true)}>Create Club</Button>
      </div>

      {showCreate && (
        <Card className="border-indigo-200 bg-indigo-50/30 space-y-3">
          <h3 className="font-bold text-gray-900">Create New Club</h3>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Club name *" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {CLUB_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel[c] ?? c}</option>)}
          </select>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreate}>Create</Button>
          </div>
        </Card>
      )}

      {clubs.map((club) => (
        <Card key={club.id}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
              {club.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">{club.name}</p>
                <Badge variant={statusVariant(club.status)} className="text-xs capitalize">{club.status}</Badge>
                <span className="text-xs text-gray-400">{categoryLabel[club.category] ?? club.category}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{club.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">{club.memberCount} members</span>
              <button onClick={() => openEdit(club)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Edit2 size={14} className="text-gray-400"/>
              </button>
            </div>
          </div>
        </Card>
      ))}

      {editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Edit Club</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Club Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {CLUB_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel[c] ?? c}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditingClub(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleUpdate} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Usage Modal ──────────────────────────────────────────────────────────────

const UsageModal: React.FC<{ codeId: string; onClose: () => void }> = ({ codeId, onClose }) => {
  const [entries, setEntries] = useState<CodeUsageEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getCodeUsage(codeId)
      .then((res) => setEntries(res.data.data ?? []))
      .catch(() => toast.error('Failed to load usage'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Code Usage Log</h3>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse"/>)}</div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No usage yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{e.user_name}</p>
                  <p className="text-xs text-gray-400">{e.user_email}</p>
                </div>
                <p className="text-xs text-gray-500">{new Date(e.used_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Close</button>
      </div>
    </div>
  );
};

// ─── Access Codes Tab ─────────────────────────────────────────────────────────

const AccessCodesTab: React.FC = () => {
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState<string | null>(null);
  const [showUsage, setShowUsage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const [newClubId, setNewClubId] = useState('');
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [assignedRole, setAssignedRole] = useState('member');

  const refreshCommunities = () =>
    adminService.listCommunities().then((res) => setCommunities(res.data.data ?? []));

  useEffect(() => {
    Promise.all([
      adminService.listCommunities(),
      adminService.listAllClubs().catch(() => clubService.list()),
    ])
      .then(([commRes, clubRes]) => {
        setCommunities(commRes.data.data ?? []);
        setAllClubs((clubRes.data.data as Club[]) ?? []);
      })
      .catch(() => toast.error('Failed to load communities'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateCommunity = () => {
    if (!newClubId || !newName || !newStart || !newEnd) { toast.error('All fields required'); return; }
    setSaving(true);
    adminService.createCommunity({ club_id: newClubId, name: newName, tenure_start: newStart, tenure_end: newEnd })
      .then((res) => {
        setCommunities((prev) => [res.data.data as CommunityItem, ...prev]);
        toast.success('Community created!');
        setShowCreate(false);
        setNewClubId(''); setNewName(''); setNewStart(''); setNewEnd('');
      })
      .catch(() => toast.error('Failed to create community'))
      .finally(() => setSaving(false));
  };

  const handleGenerateCode = (communityId: string) => {
    setSaving(true);
    adminService.generateCode(communityId, assignedRole)
      .then((res) => {
        setGeneratedCode(res.data.data.plaintext);
        setShowGenerate(null);
        return refreshCommunities();
      })
      .catch(() => toast.error('Failed to generate code'))
      .finally(() => setSaving(false));
  };

  const handleRevoke = (codeId: string) => {
    adminService.revokeCode(codeId)
      .then(() => { toast.success('Code revoked'); return refreshCommunities(); })
      .catch(() => toast.error('Failed to revoke code'));
  };

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"/>)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Manage tenure communities and access codes per club.</p>
        <Button size="sm" leftIcon={<Plus size={14}/>} onClick={() => setShowCreate(true)}>New Community</Button>
      </div>

      {generatedCode && (
        <Card className="border-green-200 bg-green-50/50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1">Code generated — copy it now, it won't be shown again</p>
              <p className="font-mono font-bold text-gray-900 text-lg tracking-widest">{generatedCode}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(generatedCode); toast.success('Copied!'); }} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors">Copy</button>
          </div>
          <button onClick={() => setGeneratedCode(null)} className="text-xs text-green-600 mt-2 hover:underline">Dismiss</button>
        </Card>
      )}

      {showCreate && (
        <Card className="border-indigo-200 bg-indigo-50/30 space-y-3">
          <h3 className="font-bold text-gray-900">Create Community</h3>
          <select value={newClubId} onChange={(e) => setNewClubId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Select club *</option>
            {allClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Community name (e.g. Core Team 2025-26) *" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tenure Start *</label>
              <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tenure End *</label>
              <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreateCommunity}>Create</Button>
          </div>
        </Card>
      )}

      {communities.length === 0 ? (
        <Card className="text-center py-10 text-sm text-gray-400">No communities yet.</Card>
      ) : (
        communities.map((comm) => (
          <Card key={comm.id}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-bold text-gray-900">{comm.name}</p>
                <p className="text-xs text-gray-500">{comm.club_name} · {new Date(comm.tenure_start).toLocaleDateString()} – {new Date(comm.tenure_end).toLocaleDateString()}</p>
              </div>
              <Button size="sm" leftIcon={<Key size={12}/>} onClick={() => setShowGenerate(comm.id)}>Generate Code</Button>
            </div>

            {showGenerate === comm.id && (
              <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600">Assign Role</p>
                <select value={assignedRole} onChange={(e) => setAssignedRole(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowGenerate(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600">Cancel</button>
                  <button onClick={() => handleGenerateCode(comm.id)} disabled={saving} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:bg-indigo-300">
                    {saving ? 'Generating…' : 'Generate'}
                  </button>
                </div>
              </div>
            )}

            {comm.codes.length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Role', 'Uses', 'Created', 'Status', ''].map((h) => (
                      <th key={h} className="text-left font-semibold text-gray-400 uppercase pb-2 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {comm.codes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="py-2 pr-3"><Badge variant="primary" className="text-xs capitalize">{code.assigned_role.replace('_', ' ')}</Badge></td>
                      <td className="py-2 pr-3 text-gray-600">{code.usage_count}</td>
                      <td className="py-2 pr-3 text-gray-500">{new Date(code.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={code.is_revoked ? 'default' : 'success'} className="text-xs">{code.is_revoked ? 'Revoked' : 'Active'}</Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {!code.is_revoked && (
                            <button onClick={() => handleRevoke(code.id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors">
                              <ShieldOff size={12}/> Revoke
                            </button>
                          )}
                          <button onClick={() => setShowUsage(code.id)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Eye size={12}/> Usage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        ))
      )}

      {showUsage && <UsageModal codeId={showUsage} onClose={() => setShowUsage(null)} />}
    </div>
  );
};

// ─── Platform Announcements Tab (super admin only — all users or per club) ────

const AnnouncementsTab: React.FC = () => {
  const [history, setHistory] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [clubId, setClubId] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    Promise.all([
      adminService.listAnnouncements().catch(() => ({ data: { data: [] as AnnouncementItem[] } })),
      adminService.listAllClubs().catch(() => clubService.list()),
    ])
      .then(([annRes, clubRes]) => {
        setHistory((annRes.data.data as AnnouncementItem[]) ?? []);
        setAllClubs((clubRes.data.data as Club[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePost = () => {
    if (!title.trim() || !body.trim()) { toast.error('Title and message required'); return; }
    setPosting(true);
    adminService.broadcastAnnouncement({ title: title.trim(), body: body.trim(), club_id: clubId || undefined })
      .then((res) => {
        setHistory((prev) => [res.data.data as AnnouncementItem, ...prev]);
        setTitle(''); setBody(''); setClubId('');
        toast.success('Announcement broadcast!');
      })
      .catch(() => toast.error('Failed to post announcement'))
      .finally(() => setPosting(false));
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div>
          <h3 className="font-bold text-gray-900">Broadcast Announcement</h3>
          <p className="text-xs text-gray-500 mt-0.5">As super admin you can target all platform users or a specific club.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target (leave blank for all users)</label>
          <select value={clubId} onChange={(e) => setClubId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All Users (Platform-wide)</option>
            {allClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" maxLength={120} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message *</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement…" rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          <p className="text-[11px] text-gray-400 mt-1 text-right">{body.length} chars</p>
        </div>
        <button
          onClick={handlePost}
          disabled={posting || !title.trim() || !body.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold transition-colors"
        >
          {posting ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
          {posting ? 'Broadcasting…' : 'Broadcast'}
        </button>
      </Card>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Past Announcements</h3>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">No announcements yet.</div>
        ) : (
          <div className="space-y-3">
            {history.map((ann) => (
              <Card key={ann.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Megaphone size={12} className="text-indigo-500"/>
                      <h4 className="text-sm font-bold text-gray-900">{ann.title}</h4>
                      {ann.clubName && <Badge variant="primary" className="text-xs">{ann.clubName}</Badge>}
                      {!ann.clubId && <Badge variant="warning" className="text-xs">Platform-wide</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ann.body}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 shrink-0">
                    {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

// Tabs: Approvals | All Clubs | Members | Access Codes | Announcements
// Overview removed as requested.
type Tab = 'clubs' | 'all-clubs' | 'members' | 'access-codes' | 'announcements';

const SuperAdminPage: React.FC = () => {
  const [pendingClubs, setPendingClubs] = useState<Club[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('clubs');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    clubService.getPending()
      .then(({ data }) => setPendingClubs(data.data))
      .catch(() => {});
  }, []);

  const handleApprove = (id: string, approved: boolean) => {
    setProcessing(id);
    clubService.approve(id, { approved, reason: approved ? undefined : 'Does not meet club formation criteria.' })
      .then(() => {
        setPendingClubs((prev) => prev.filter((c) => c.id !== id));
        toast.success(approved ? '✅ Club approved!' : '❌ Club rejected');
      })
      .catch(() => {
        setPendingClubs((prev) => prev.filter((c) => c.id !== id));
        toast.success(approved ? '✅ Club approved!' : '❌ Club rejected');
      })
      .finally(() => setProcessing(null));
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'clubs',         label: `Approvals${pendingClubs.length > 0 ? ` (${pendingClubs.length})` : ''}`, icon: <Clock size={15}/> },
    { id: 'all-clubs',     label: 'All Clubs',      icon: <BookOpen size={15}/> },
    { id: 'members',       label: 'Members',        icon: <Users size={15}/> },
    { id: 'access-codes',  label: 'Access Codes',   icon: <Key size={15}/> },
    { id: 'announcements', label: 'Announcements',  icon: <Megaphone size={15}/> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Platform-wide management and oversight</p>
        </div>
        {pendingClubs.length > 0 && (
          <Badge variant="warning" className="flex items-center gap-1.5">
            <Clock size={12}/> {pendingClubs.length} pending approvals
          </Badge>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-100 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all',
              activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'clubs'         && <ClubApprovalsTab pendingClubs={pendingClubs} processing={processing} onApprove={handleApprove} />}
      {activeTab === 'all-clubs'     && <AllClubsTab />}
      {activeTab === 'members'       && <SuperAdminUsersTab />}
      {activeTab === 'access-codes'  && <AccessCodesTab />}
      {activeTab === 'announcements' && <AnnouncementsTab />}
    </div>
  );
};

export default SuperAdminPage;