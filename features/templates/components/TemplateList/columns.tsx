import type { ColumnDef } from '@/components/shared/DataTable'
import type { Template } from '@/types/template'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, truncate } from '@/lib/utils'

export const templateColumns: ColumnDef<Template>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    sortable: true,
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: 'subject',
    header: 'Subject',
    accessorKey: 'subject',
    sortable: true,
    cell: (row) => (
      <span className="text-muted-foreground">{truncate(row.subject, 50)}</span>
    ),
  },
  {
    id: 'variables',
    header: 'Variables',
    cell: (row) => (
      <Badge variant="secondary">{row.variables.length} vars</Badge>
    ),
  },
  {
    id: 'updatedAt',
    header: 'Last Modified',
    accessorKey: 'updatedAt',
    sortable: true,
    cell: (row) => (
      <span className="text-muted-foreground text-sm">
        {formatRelativeTime(row.updatedAt)}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge status={row.status} />,
  },
]
