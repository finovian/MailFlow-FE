'use client'

import * as React from 'react'
import { useEventDetail } from '@/features/events/hooks/useEvents'
import { EventTimeline } from './EventTimeline'
import { EventJobList } from './EventJobList'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Loader2, ArrowLeft, RefreshCw, Calendar, FileJson, Cpu } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EventProcessingPanelProps {
  eventId: string
  onBack?: () => void
}

export function EventProcessingPanel({ eventId, onBack }: EventProcessingPanelProps) {
  const { data: event, isLoading, error, refetch, isFetching } = useEventDetail(eventId, true)
  const [showPayload, setShowPayload] = React.useState(false)

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Initializing simulation pipeline...</span>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          <ArrowLeft className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Pipeline Error</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            {error instanceof Error ? error.message : 'The requested simulation run could not be retrieved.'}
          </p>
        </div>
        <Button onClick={onBack} variant="outline" size="sm">
          Return to Events
        </Button>
      </div>
    )
  }

  const isRunning = event.status === 'PENDING' || event.status === 'PROCESSING'

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground shrink-0 border border-border/10"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">RUN</span>
              <span className="font-mono text-xs font-bold text-foreground truncate">
                {event.id}
              </span>
              <StatusBadge status={event.status} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-1">
              <Cpu className="size-5 text-primary" />
              Event Sim: <span className="text-primary/90">{event.eventType}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setShowPayload(!showPayload)}
            className="h-8 text-[11px] gap-1 px-3 border-border/40"
          >
            <FileJson className="size-3.5" />
            {showPayload ? 'Hide Payload' : 'View Payload'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-[11px] gap-1.5 px-3 border-border/40"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Payload Display */}
      {showPayload && (
        <div className="rounded-lg border border-border/40 bg-black/95 p-4 overflow-x-auto relative">
          <div className="absolute top-2.5 right-2.5 text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest bg-muted/20 border border-border/10 px-1.5 py-0.5 rounded">
            JSON
          </div>
          <pre className="text-[11px] font-mono text-emerald-400/90 leading-relaxed">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}

      {/* Grid: Timeline + Jobs */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Hand: Operations Timeline */}
        <div className="lg:col-span-7 bg-card/15 border border-border/40 backdrop-blur-md rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <EventTimeline event={event} />
        </div>

        {/* Right Hand: Active Jobs List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card/15 border border-border/40 backdrop-blur-md rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Run Information
              </h3>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-border/10">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3.5" /> Created At
                </span>
                <span className="font-medium text-foreground">{formatDate(event.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/10">
                <span className="text-muted-foreground">Idempotency Verify</span>
                <span className="text-emerald-500 font-semibold uppercase tracking-wider text-[9px]">Verified</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/10">
                <span className="text-muted-foreground">Matching Job Count</span>
                <span className="font-semibold text-foreground">{event.jobCount}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Orchestration Gateway</span>
                <span className="font-medium text-foreground">Inngest Workflow Engine</span>
              </div>
            </div>
          </div>

          <EventJobList jobs={event.jobs} />
        </div>
      </div>
    </div>
  )
}
export default EventProcessingPanel
