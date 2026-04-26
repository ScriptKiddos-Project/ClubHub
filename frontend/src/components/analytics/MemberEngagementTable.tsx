import { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import api from '../../services/api';
import { ChevronUp, ChevronDown } from 'lucide-react';

type Badge = 'Active' | 'Moderate' | 'Inactive';

interface MemberScore {
  userId: string;
  name: string;
  email: string;
  department: string;
  tenureDays: number;
  eventsAttended: number;
  feedbackSubmitted: number;
  engagementScore: number;
  badge: Badge;
}

const BADGE_STYLES: Record<Badge, string> = {
  Active: 'bg-green-100 text-green-700',
  Moderate: 'bg-amber-100 text-amber-700',
  Inactive: 'bg-red-100 text-red-600',
};

const columnHelper = createColumnHelper<MemberScore>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Member',
    cell: (info) => (
      <div>
        <p className="font-medium text-sm">{info.getValue()}</p>
        <p className="text-xs text-muted-foreground">{info.row.original.email}</p>
      </div>
    ),
  }),
  columnHelper.accessor('department', {
    header: 'Department',
    cell: (info) => <span className="text-sm">{info.getValue()}</span>,
  }),
  columnHelper.accessor('tenureDays', {
    header: 'Tenure (days)',
    cell: (info) => <span className="text-sm">{info.getValue()}</span>,
  }),
  columnHelper.accessor('eventsAttended', {
    header: 'Events',
    cell: (info) => <span className="text-sm font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('engagementScore', {
    header: 'Score',
    cell: (info) => <span className="text-sm font-bold">{info.getValue().toFixed(2)}</span>,
  }),
  columnHelper.accessor('badge', {
    header: 'Status',
    cell: (info) => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[info.getValue()]}`}>
        {info.getValue()}
      </span>
    ),
  }),
];

export function MemberEngagementTable({ clubId }: { clubId: string }) {
  const [data, setData] = useState<MemberScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'engagementScore', desc: true }]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/clubs/${clubId}/engagement`)
      .then((res) => setData(res.data.data))
      .finally(() => setIsLoading(false));
  }, [clubId]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Member Engagement Scores</h3>
        <span className="text-xs text-muted-foreground">{data.length} members</span>
      </div>

      <div ref={tableContainerRef} className="overflow-auto" style={{ maxHeight: 480 }}>
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <ChevronUp className="h-3 w-3" />}
                      {header.column.getIsSorted() === 'desc' && <ChevronDown className="h-3 w-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className="border-b hover:bg-muted/30 transition-colors"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}