'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Edit, Trash2, Send, Mail } from 'lucide-react'
import { useTemplates, useDeleteTemplate } from '@/features/templates/hooks/useTemplates'
import { templateColumns } from './columns'
import { DataTable, type ColumnDef } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TestSendDialog } from '../TestSendDialog'
import type { Template } from '@/types/template'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TemplateList() {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'active' | 'draft' | 'all'>('all')
  const [sortField, setSortField] = React.useState('updatedAt')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')

  // Dialog states
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [deleteName, setDeleteName] = React.useState('')
  const [testSendTemplate, setTestSendTemplate] = React.useState<Template | null>(null)

  // Fetch templates query
  const { data, isLoading } = useTemplates({
    page,
    pageSize,
    search,
    status: statusFilter,
    sort: sortField,
    order: sortOrder,
  })

  // Delete mutation
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate()

  const handleDelete = () => {
    if (!deleteId) return
    deleteTemplate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  // Extend columns with actions
  const columnsWithActions = React.useMemo((): ColumnDef<Template>[] => {
    return [
      ...templateColumns,
      {
        id: 'actions',
        header: 'Actions',
        className: 'w-[100px] text-right',
        cell: (row) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => router.push(`/templates/${row.id}`)}>
                  <Edit className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTestSendTemplate(row)}>
                  <Send className="mr-2 size-4" />
                  Test Send
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeleteId(row.id)
                    setDeleteName(row.name)
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ]
  }, [router])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Templates"
        description="Create and manage your reusable email template designs."
      >
        <Button onClick={() => router.push('/templates/new')} className="gap-1.5">
          <Plus className="size-4" />
          Create Template
        </Button>
      </PageHeader>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search templates..."
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/templates/${row.id}`)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Draft', value: 'draft' },
            ],
          },
        ]}
        activeFilters={{ status: statusFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setStatusFilter((value as any) || 'all')
            setPage(1)
          }
        }}
        onSortChange={(sort, order) => {
          setSortField(sort)
          setSortOrder(order)
        }}
        emptyMessage="No templates found"
        emptyIcon={Mail}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Template"
        description={`Are you sure you want to delete "${deleteName}"? This action cannot be undone and triggers relying on this template will stop working.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {testSendTemplate && (
        <TestSendDialog
          open={!!testSendTemplate}
          onOpenChange={(open) => !open && setTestSendTemplate(null)}
          templateId={testSendTemplate.id}
          templateName={testSendTemplate.name}
          variables={testSendTemplate.variables || []}
        />
      )}
    </div>
  )
}
