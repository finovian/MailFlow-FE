'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, type LucideIcon } from 'lucide-react'
import { DataTablePagination } from '@/components/shared/DataTable/DataTablePagination'
import { DataTableSkeleton } from '@/components/shared/DataTable/DataTableSkeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import type { FilterConfig } from '@/types/api'

export interface ColumnDef<T, V = unknown> {
  id: string
  header: string
  accessorKey?: keyof T & string
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSortChange?: (sort: string, order: 'asc' | 'desc') => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  searchPlaceholder?: string
  isLoading?: boolean
  filters?: FilterConfig[]
  activeFilters?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  onRowClick?: (row: T) => void
  emptyMessage?: string
  emptyIcon?: LucideIcon
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  searchValue = '',
  searchPlaceholder = 'Search...',
  isLoading = false,
  filters,
  activeFilters,
  onFilterChange,
  onRowClick,
  emptyMessage = 'No results found',
  emptyIcon,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = React.useState(searchValue)
  const [sortState, setSortState] = React.useState<{
    column: string
    order: 'asc' | 'desc'
  } | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setInternalSearch(searchValue)
  }, [searchValue])

  const handleSearchChange = (value: string) => {
    setInternalSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearchChange?.(value)
    }, 400)
  }

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSort = (columnId: string) => {
    const newOrder: 'asc' | 'desc' =
      sortState?.column === columnId && sortState.order === 'asc'
        ? 'desc'
        : 'asc'
    setSortState({ column: columnId, order: newOrder })
    onSortChange?.(columnId, newOrder)
  }

  const getCellValue = (row: T, column: ColumnDef<T, unknown>): React.ReactNode => {
    if (column.cell) return column.cell(row)
    if (column.accessorKey) {
      const value = row[column.accessorKey]
      return String(value ?? '')
    }
    return null
  }

  const showToolbar = onSearchChange || (filters && filters.length > 0)

  return (
    <div className="space-y-3">
      {showToolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {onSearchChange && (
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={internalSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}

          {filters && filters.length > 0 && onFilterChange && (
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  value={activeFilters?.[filter.key] ?? 'all'}
                  onValueChange={(value) =>
                    onFilterChange(filter.key, value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className="h-8 w-auto min-w-[120px]" size="sm">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border/50 bg-card/50">
        {isLoading ? (
          <DataTableSkeleton columnCount={columns.length} />
        ) : data.length === 0 ? (
          <div className="py-6">
            <EmptyState
              title={emptyMessage}
              description="Try adjusting your search or filters."
              icon={emptyIcon}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      column.sortable && 'cursor-pointer select-none',
                      column.className
                    )}
                    onClick={
                      column.sortable
                        ? () => handleSort(column.id)
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {column.header}
                      {column.sortable && (
                        <span className="text-muted-foreground/50">
                          {sortState?.column === column.id ? (
                            sortState.order === 'asc' ? (
                              <ArrowUp className="size-3.5" />
                            ) : (
                              <ArrowDown className="size-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={cn(
                    onRowClick &&
                      'cursor-pointer transition-colors hover:bg-muted/60'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
