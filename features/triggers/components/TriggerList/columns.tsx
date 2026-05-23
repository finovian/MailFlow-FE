import type { ColumnDef } from '@/components/shared/DataTable'
import type { Trigger } from '@/types/trigger'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

export const triggerColumns: ColumnDef<Trigger>[] = [
  {
    id: 'name',
    header: 'Trigger Name',
    accessorKey: 'name',
    sortable: true,
    cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
  },
  {
    id: 'eventType',
    header: 'Event Type',
    accessorKey: 'eventType',
    sortable: true,
    cell: (row) => (
      <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/10">
        {row.eventType}
      </span>
    ),
  },
  {
    id: 'template',
    header: 'Target Template',
    cell: (row) => (
      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
        {row.templateName || row.templateId}
      </span>
    ),
  },
  {
    id: 'cooldownDays',
    header: 'Cooldown',
    cell: (row) => (
      <Badge variant="secondary">
        {row.cooldownDays > 0 ? `${row.cooldownDays} days` : 'None'}
      </Badge>
    ),
  },
  {
    id: 'sendOnce',
    header: 'Send Once',
    cell: (row) => (
      <span className="text-xs text-muted-foreground">
        {row.sendOnce ? 'Yes' : 'No'}
      </span>
    ),
  },
  {
    id: 'lastFiredAt',
    header: 'Last Fired',
    cell: (row) => (
      <span className="text-xs text-muted-foreground">
        {row.lastFiredAt ? formatRelativeTime(row.lastFiredAt) : 'Never'}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge status={row.status} />,
  },
]
