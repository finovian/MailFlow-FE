'use client'

import * as React from 'react'
import { useLogs } from '@/features/logs/hooks/useLogs'
import { logColumns } from './columns'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { LogDetailDialog } from '../LogDetailDialog'
import { ScrollText } from 'lucide-react'
import type { SendLog } from '@/types/log'

export function LogList() {
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<any>('all')
  const [sortField, setSortField] = React.useState('sentAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')

  // Selected log for detail view
  const [selectedLog, setSelectedLog] = React.useState<SendLog | null>(null)

  // Fetch logs query
  const { data, isLoading } = useLogs({
    page,
    pageSize,
    search,
    status: statusFilter,
    sort: sortField,
    order: sortOrder,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery & Run Logs"
        description="Audit trail of every single automated email execution and SMTP delivery dispatch."
      />

      <DataTable
        columns={logColumns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by recipient email..."
        isLoading={isLoading}
        onRowClick={(row) => setSelectedLog(row)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Sent', value: 'sent' },
              { label: 'Failed', value: 'failed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Retrying', value: 'retrying' },
            ],
          },
        ]}
        activeFilters={{ status: statusFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setStatusFilter(value || 'all')
            setPage(1)
          }
        }}
        onSortChange={(sort, order) => {
          setSortField(sort)
          setSortOrder(order)
        }}
        emptyMessage="No run logs found"
        emptyIcon={ScrollText}
      />

      <LogDetailDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  )
}
