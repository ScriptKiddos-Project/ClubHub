import React, { useEffect, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { VirtualTable } from '../../components/virtual-table/Virtualtable';
import { Badge, Avatar, Card } from '../../components/ui';
import { adminService, type AdminUser } from '../../services/adminService';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'student' | 'member' | 'secretary' | 'event_manager' | 'club_admin' | 'super_admin';

const ROLES: UserRole[] = ['student', 'member', 'secretary', 'event_manager', 'club_admin'];

const col = createColumnHelper<AdminUser>();

// ─── Component ────────────────────────────────────────────────────────────────

export const SuperAdminUsersTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [showRoleModal, setShowRoleModal] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    adminService.listUsers()
      // Backend: { success, data: UserListItem[], meta }
      // Axios wraps that as res.data, so res.data.data is the users array
      .then((res) => setUsers(res.data.data ?? []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role as UserRole);
    setShowRoleModal(true);
  };

  const handleRoleChange = () => {
    if (!selectedUser) return;
    setChangingRole(selectedUser.id);
    adminService.changeUserRole(selectedUser.id, newRole)
      .then(() => {
        setUsers((prev) =>
          prev.map((u) => u.id === selectedUser.id ? { ...u, role: newRole } : u)
        );
        toast.success(`Role updated to ${newRole.replace('_', ' ')}`);
        setShowRoleModal(false);
      })
      .catch(() => toast.error('Failed to update role'))
      .finally(() => setChangingRole(null));
  };

  const roleVariant = (role: string): 'warning' | 'success' | 'primary' | 'default' =>
    role === 'super_admin' || role === 'club_admin' ? 'warning'
    : role === 'secretary' ? 'success'
    : role === 'event_manager' || role === 'member' ? 'primary'
    : 'default';

  const USER_COLUMNS = [
    col.display({
      id: 'user',
      header: 'User',
      size: 260,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.original.name} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate text-sm">{row.original.name}</p>
            <p className="text-xs text-gray-400 truncate">{row.original.email}</p>
          </div>
        </div>
      ),
    }),
    col.accessor('department', {
      header: 'Department',
      size: 160,
      cell: (info) => <span className="text-gray-600 text-sm">{info.getValue() ?? '—'}</span>,
    }),
    col.accessor('role', {
      header: 'Role',
      size: 150,
      cell: (info) => (
        <Badge variant={roleVariant(info.getValue())} className="text-xs capitalize">
          {info.getValue().replace('_', ' ')}
        </Badge>
      ),
    }),
    col.accessor('total_points', {   // ← fixed: was 'points'
      header: 'Points',
      size: 90,
      cell: (info) => (
        <span className="font-semibold text-indigo-600">{info.getValue() ?? 0}</span>
      ),
    }),
    col.accessor('created_at', {     // ← fixed: was 'createdAt'
      header: 'Joined',
      size: 130,
      cell: (info) => (
        <span className="text-gray-500 text-sm">
          {new Date(info.getValue()).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    }),
    col.display({
      id: 'actions',
      header: 'Actions',
      size: 110,
      cell: ({ row }) => (
        <button
          onClick={() => openRoleModal(row.original)}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 transition-colors"
        >
          Change Role
        </button>
      ),
    }),
  ];

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Platform Users</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? 'Loading…' : `${users.length} users total`}
            </p>
          </div>
          <button
            onClick={loadUsers}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">No users found.</div>
        ) : (
          <VirtualTable
            data={users}
            columns={USER_COLUMNS}
            rowHeight={52}
            visibleRows={12}
            onRowClick={(row) => openRoleModal(row)}
          />
        )}
      </Card>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Change Role</h3>
            <div className="flex items-center gap-3">
              <Avatar name={selectedUser.name} size="sm" />
              <div>
                <p className="font-medium text-gray-900 text-sm">{selectedUser.name}</p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={changingRole === selectedUser.id}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
              >
                {changingRole === selectedUser.id ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminUsersTab;