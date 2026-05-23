'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Zap,
  Play,
  Pause,
  Copy,
  Terminal,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  useTriggers,
  useDeleteTrigger,
  useCreateTrigger,
  useUpdateTrigger,
} from '@/features/triggers/hooks/useTriggers'
import { eventsService } from '@/services/events.service'
import { triggerColumns } from './columns'
import { DataTable, type ColumnDef } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Trigger } from '@/types/trigger'
import { getEventMockPayload, getEventDefinition } from '@/lib/eventRegistry'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TriggerList() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // State filters
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [eventTypeFilter, setEventTypeFilter] = React.useState('all')
  const [groupByCategory, setGroupByCategory] = React.useState(true)

  // Collapse/Expand state for categories
  const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({})

  // Pagination states
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  // Active item states
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [deleteName, setDeleteName] = React.useState('')

  const [simulateTrigger, setSimulateTrigger] = React.useState<Trigger | null>(null)
  const [simulateMockText, setSimulateMockText] = React.useState('')

  // Fetch triggers
  const { data, isLoading } = useTriggers()

  // Mutations
  const { mutate: deleteTrigger, isPending: isDeleting } = useDeleteTrigger()
  const { mutate: updateTrigger } = useUpdateTrigger()
  const { mutate: createTrigger } = useCreateTrigger()

  // Fire simulation event mutation
  const { mutate: fireEvent, isPending: isFiringEvent } = useMutation({
    mutationFn: (payload: { eventType: string; idempotencyKey: string; payload: Record<string, unknown> }) =>
      eventsService.fire(payload),
    onSuccess: () => {
      toast.success('Simulation event fired! Triggers are being evaluated in the background.')
      setSimulateTrigger(null)
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to fire simulation event')
    },
  })

  const handleDelete = () => {
    if (!deleteId) return
    deleteTrigger(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  // Toggle trigger active status
  const handleToggleStatus = (trigger: Trigger) => {
    const newStatus = trigger.status === 'active' ? 'inactive' : 'active'
    updateTrigger(
      {
        id: trigger.id,
        data: { status: newStatus },
      },
      {
        onSuccess: () => {
          toast.success(`Trigger status updated to ${newStatus}`)
        },
      }
    )
  }

  // Duplicate a trigger
  const handleDuplicate = (trigger: Trigger) => {
    createTrigger(
      {
        name: `${trigger.name} (Copy)`,
        eventType: trigger.eventType,
        conditions: trigger.conditions,
        templateId: trigger.templateId,
        recipientField: trigger.recipientField,
        cooldownDays: trigger.cooldownDays,
        sendOnce: trigger.sendOnce,
        status: 'active', // active by default
      },
      {
        onSuccess: () => {
          toast.success('Trigger duplicated successfully!')
        },
      }
    )
  }

  // Initialize and open simulate dialog
  const handleOpenSimulate = (trigger: Trigger) => {
    setSimulateTrigger(trigger)
    const mock = getEventMockPayload(trigger.eventType)
    setSimulateMockText(JSON.stringify(mock, null, 2))
  }

  const handleFireSimulation = () => {
    if (!simulateTrigger) return
    try {
      const parsed = JSON.parse(simulateMockText)
      fireEvent({
        eventType: simulateTrigger.eventType,
        idempotencyKey: `sim_${Date.now()}`,
        payload: parsed,
      })
    } catch (err) {
      toast.error('Invalid JSON payload structure.')
    }
  }

  // Fetch unique eventType options from items list for filter dropdown
  const uniqueEventTypes = React.useMemo(() => {
    if (!data?.data) return []
    const set = new Set<string>()
    data.data.forEach((t) => set.add(t.eventType))
    return Array.from(set)
  }, [data])

  // Filter triggers based on search, status, and eventType
  const filteredData = React.useMemo(() => {
    if (!data?.data) return []
    return data.data.filter((item) => {
      // 1. Search Query
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.templateName || '').toLowerCase().includes(searchQuery.toLowerCase())

      // 2. Status
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.status === 'active') ||
        (statusFilter === 'inactive' && item.status === 'inactive')

      // 3. Event Type
      const matchesEventType = eventTypeFilter === 'all' || item.eventType === eventTypeFilter

      return matchesSearch && matchesStatus && matchesEventType
    })
  }, [data, searchQuery, statusFilter, eventTypeFilter])

  // Group triggers by Category
  const groupedData = React.useMemo(() => {
    const groups: Record<string, { label: string; items: Trigger[] }> = {}

    filteredData.forEach((item) => {
      const def = getEventDefinition(item.eventType)
      const cat = def?.category || 'other'
      const label = def?.categoryLabel || 'Other Events'

      if (!groups[cat]) {
        groups[cat] = { label, items: [] }
      }
      groups[cat]!.items.push(item)
    })

    return groups
  }, [filteredData])

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }))
  }

  // Row Action Column Injection
  const columnsWithActions = React.useMemo((): ColumnDef<Trigger>[] => {
    return [
      ...triggerColumns,
      {
        id: 'actions',
        header: 'Actions',
        className: 'w-[180px] text-right',
        cell: (row) => (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Inline Shortcuts */}
            <Button
              variant="ghost"
              size="icon-xs"
              title={row.status === 'active' ? 'Pause Trigger' : 'Activate Trigger'}
              onClick={() => handleToggleStatus(row)}
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              {row.status === 'active' ? (
                <Pause className="size-3.5 text-amber-500 fill-amber-500/10" />
              ) : (
                <Play className="size-3.5 text-emerald-500 fill-emerald-500/10" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon-xs"
              title="Duplicate Automation"
              onClick={() => handleDuplicate(row)}
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <Copy className="size-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon-xs"
              title="Simulate Event Execution"
              onClick={() => handleOpenSimulate(row)}
              className="size-7 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Terminal className="size-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="size-7">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => router.push(`/triggers/${row.id}`)} className="cursor-pointer">
                  <Edit className="mr-2 size-4" />
                  Edit Rules
                </DropdownMenuItem>
                {/* <DropdownMenuSeparator /> */}
                {/* <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeleteId(row.id)
                    setDeleteName(row.name)
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem> */}
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
        title="Automations & Rules"
        description="Bind incoming system event payloads to targeted email templates using dynamic filter rules."
      >
        <Button
          onClick={() => router.push('/triggers/new')}
          className="gap-1.5 shadow-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 border-0"
        >
          <Plus className="size-4" />
          Create Trigger
        </Button>
      </PageHeader>

      {/* Advanced Filters Toolbar */}
      <Card className="border-border/50 bg-card/30">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative max-w-sm flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, event type, or template..."
                className="pl-9 h-9 text-xs bg-card/65"
              />
            </div>

            {/* Quick selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="size-3.5 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                  <SelectTrigger className="h-8.5 text-xs w-[130px] bg-card/65 shadow-none" size="sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="active" className="text-xs">Active Only</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="h-8.5 text-xs w-[170px] bg-card/65 shadow-none" size="sm">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Event Types</SelectItem>
                  {uniqueEventTypes.map((type) => (
                    <SelectItem key={type} value={type} className="font-mono text-xs">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Grouping switch */}
              <div className="flex items-center gap-2 border-l border-border/40 pl-3 h-8">
                <Label htmlFor="group-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  Group by Event
                </Label>
                <Switch
                  id="group-toggle"
                  checked={groupByCategory}
                  onCheckedChange={setGroupByCategory}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading view */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Main List Display */}
      {!isLoading && filteredData.length === 0 && (
        <Card className="border-dashed border-border/80 bg-muted/5 py-12 flex flex-col items-center justify-center text-center">
          <Zap className="size-10 stroke-1 text-muted-foreground mb-3" />
          <h3 className="text-sm font-semibold">No triggers found</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Try adjusting your search queries or filters, or create your first automation flow.
          </p>
        </Card>
      )}

      {!isLoading && filteredData.length > 0 && (
        <>
          {groupByCategory ? (
            /* Grouped category layout */
            <div className="space-y-6">
              {Object.entries(groupedData).map(([catKey, cat]) => {
                const isCollapsed = !!collapsedCategories[catKey]
                return (
                  <Card key={catKey} className="border-border/50 bg-card/25 shadow-xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapse(catKey)}
                      className="w-full flex items-center justify-between p-4 bg-muted/15 border-b border-border/40 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="size-4 text-indigo-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          {cat.label}
                        </span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-200/10 dark:text-indigo-400">
                          {cat.items.length} Triggers
                        </Badge>
                      </div>
                      {isCollapsed ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronUp className="size-4 text-muted-foreground" />}
                    </button>
                    {!isCollapsed && (
                      <div className="p-4">
                        <DataTable
                          columns={columnsWithActions}
                          data={cat.items}
                          total={cat.items.length}
                          page={1}
                          pageSize={100}
                          onPageChange={() => {}}
                          onPageSizeChange={() => {}}
                          onRowClick={(row) => router.push(`/triggers/${row.id}`)}
                          emptyMessage="No triggers in this category"
                        />
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            /* Flat single list layout */
            <DataTable
              columns={columnsWithActions}
              data={filteredData.slice((page - 1) * pageSize, page * pageSize)}
              total={filteredData.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onRowClick={(row) => router.push(`/triggers/${row.id}`)}
              emptyMessage="No triggers match criteria"
              emptyIcon={Zap}
            />
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Trigger Rule"
        description={`Are you sure you want to delete trigger "${deleteName}"? This action cannot be undone and events matching this trigger will no longer send automation emails.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      {/* Simulation Dialog */}
      <Dialog open={!!simulateTrigger} onOpenChange={(open) => !open && setSimulateTrigger(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Terminal className="size-4 text-indigo-600 dark:text-indigo-400" />
              Simulate Event Execution
            </DialogTitle>
            <DialogDescription className="text-xs">
              Dispatch a test event payload of type "{simulateTrigger?.eventType}" to trigger rules evaluation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-950/20 p-3 space-y-1.5">
              <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 block">
                Trigger configuration info
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-muted-foreground leading-relaxed">
                <div>Name: <span className="text-foreground">{simulateTrigger?.name}</span></div>
                <div>Event: <span className="font-mono text-foreground">{simulateTrigger?.eventType}</span></div>
                <div>Template: <span className="text-foreground">{simulateTrigger?.templateName || simulateTrigger?.templateId}</span></div>
                <div>Recipient: <span className="font-mono text-foreground">{simulateTrigger?.recipientField}</span></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Simulation Mock Payload (JSON)</Label>
              <textarea
                value={simulateMockText}
                onChange={(e) => setSimulateMockText(e.target.value)}
                rows={8}
                className="w-full font-mono text-xs p-3 bg-zinc-950 text-green-400 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                disabled={isFiringEvent}
              />
              <p className="text-[10px] text-muted-foreground">
                Edit the JSON payload properties to verify conditions criteria and variable merges correctly.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSimulateTrigger(null)}
              disabled={isFiringEvent}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleFireSimulation}
              disabled={isFiringEvent}
              className="text-xs h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-medium gap-1.5"
            >
              {isFiringEvent ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Zap className="size-3.5 fill-white/10" />
              )}
              Fire Simulation Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
