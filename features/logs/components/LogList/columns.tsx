import type { ColumnDef } from '@/components/shared/DataTable'
import type { SendLog } from '@/types/log'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'

export const logColumns: ColumnDef<SendLog>[] = [
  {
    id: 'recipient',
    header: 'Recipient',
    accessorKey: 'recipient',
    sortable: true,
    cell: (row) => <span className="font-medium text-foreground">{row.recipient}</span>,
  },
  {
    id: 'triggerName',
    header: 'Trigger',
    accessorKey: 'triggerName',
    sortable: true,
    cell: (row) => (
      <span className="text-xs font-semibold text-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/10">
        {row.triggerName || 'Ad-hoc Test'}
      </span>
    ),
  },
  {
    id: 'eventType',
    header: 'Event Type',
    accessorKey: 'eventType',
    sortable: true,
    cell: (row) => (
      <span className="font-mono text-[10px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800/40 px-1 py-0.5 rounded">
        {row.eventType}
      </span>
    ),
  },
  {
    id: 'templateName',
    header: 'Template',
    accessorKey: 'templateName',
    sortable: true,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.templateName}</span>,
  },
  {
    id: 'sentAt',
    header: 'Sent At',
    accessorKey: 'sentAt',
    sortable: true,
    cell: (row) => (
      <span className="text-xs text-muted-foreground">
        {row.sentAt ? formatDate(row.sentAt) : formatDate(row.createdAt)}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge status={row.status} />,
  },
]
