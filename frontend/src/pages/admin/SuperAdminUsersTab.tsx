import React, { useEffect, useState } from 'react';
import {
  createColumnHelper,
} from '@tanstack/react-table';
import { VirtualTable } from '../../components/virtual-table/Virtualtable';
import { Badge, Avatar, Card } from '../../components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'student' | 'member' | 'secretary' | 'event_manager' | 'super_admin';

interface UserRow {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  joined: string;
  status: 'active' | 'inactive';
  points: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const DEPTS = ['Computer Science', 'Data Science', 'Physics', 'Business', 'Mechanical', 'EEE', 'Civil', 'Biotech'];
const ROLES: UserRole[] = ['student', 'student', 'student', 'member', 'member', 'secretary', 'event_manager'];
const FIRST = ['Priya', 'James', 'Aisha', 'Carlos', 'Mei', 'Rohan', 'Sofia', 'Kwame', 'Elena', 'Arjun'];
const LAST = ['Sharma', 'Wu', 'Okonkwo', 'Mendez', 'Chen', 'Patel', 'García', 'Asante', 'Ivanova', 'Nair'];

function generateUsers(count: number): UserRow[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    return {
      id: `u-${i}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@campus.edu`,
      department: DEPTS[i % DEPTS.length],
      role: ROLES[i % ROLES.length],
      joined: new Date(Date.now() - i * 2 * 86400000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
      status: i % 11 === 0 ? 'inactive' : 'active',
      points: (i * 137) % 800,
    };
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_COUNTS = [100, 1_000, 5_000, 10_000] as const;

const col = createColumnHelper<UserRow>();

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
    cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
  }),

  col.accessor('role', {
    header: 'Role',
    size: 140,
    cell: (info) => {
      const role = info.getValue();
      const variant =
        role === 'secretary' ? 'success'
        : role === 'event_manager' ? 'warning'
        : role === 'member' ? 'primary'
        : 'default';
      return (
        <Badge variant={variant} className="text-xs capitalize">
          {role.replace('_', ' ')}
        </Badge>
      );
    },
  }),

  col.accessor('points', {
    header: 'Points',
    size: 90,
    cell: (info) => <span className="font-semibold text-indigo-600">{info.getValue()}</span>,
  }),

  col.accessor('joined', {
    header: 'Joined',
    size: 130,
    cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
  }),

  col.accessor('status', {
    header: 'Status',
    size: 100,
    cell: (info) => (
      <Badge variant={info.getValue() === 'active' ? 'success' : 'default'} className="text-xs capitalize">
        {info.getValue()}
      </Badge>
    ),
  }),
];

// ─── Component ────────────────────────────────────────────────────────────────

export const SuperAdminUsersTab: React.FC = () => {
  const [rowCount, setRowCount] = useState<number>(1_000);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUsers(generateUsers(rowCount));
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [rowCount]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-gray-900">Platform Users</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Virtualised table — only ~15 DOM nodes regardless of row count
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Test size:</span>
          {ROW_COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => {
                setLoading(true);
                setRowCount(n);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                rowCount === n
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {n.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <VirtualTable
          data={users}
          columns={USER_COLUMNS}
          rowHeight={52}
          visibleRows={12}
          onRowClick={(row) => console.log('Clicked:', row)}
        />
      )}
    </Card>
  );
};

export default SuperAdminUsersTab;