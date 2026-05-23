'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, Loader2, X, AlertCircle, HelpCircle } from 'lucide-react'
import type { SimulationEvent, TimelineStepData } from '@/types/event'

interface TimelineStepProps {
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped'
  timestamp?: string
  isLast?: boolean
  details?: Record<string, unknown>
  triggerName?: string
}

function ConditionDetails({ details, triggerName, status }: { details: Record<string, unknown>, triggerName?: string, status: string }) {
  if (!details) return null
  
  return (
    <div className="mt-3 rounded-lg border border-border/40 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "size-1.5 rounded-full",
            status === 'skipped' ? "bg-amber-500" : "bg-destructive"
          )} />
          <span className="text-[10px] font-bold text-foreground uppercase tracking-tight">
            Condition {status === 'skipped' ? 'Evaluated' : 'Failed'}
          </span>
        </div>
        {triggerName && (
          <span className="text-[9px] font-semibold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
            {triggerName}
          </span>
        )}
      </div>
      
      <div className="space-y-2.5">
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Rule</p>
          <p className="text-[10.5px] font-mono font-medium text-foreground bg-background/50 p-1.5 rounded border border-border/20">
            {String(details.field)} <span className="text-primary mx-1">{String(details.operator)}</span> {String(details.expected)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Received</p>
          <p className="text-[10.5px] font-mono font-medium text-foreground bg-background/50 p-1.5 rounded border border-border/20">
            {String(details.actual)}
          </p>
        </div>
      </div>
      
      <div className="pt-2 border-t border-border/10 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground italic">Result</span>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          status === 'skipped' ? "text-amber-600 bg-amber-50" : "text-destructive bg-destructive/5"
        )}>
          {status === 'skipped' ? 'Email Skipped' : 'Step Failed'}
        </span>
      </div>
    </div>
  )
}

function TimelineStep({ title, description, status, timestamp, isLast, details, triggerName }: TimelineStepProps) {
  const isCompleted = status === 'completed'
  const isActive = status === 'active'
  const isFailed = status === 'failed'
  const isSkipped = status === 'skipped'

  return (
    <div className="relative flex gap-4 pb-8 group">
      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-3 top-7 bottom-0 w-0.5 transition-colors duration-300',
            isCompleted ? 'bg-emerald-500/30' : 
            isFailed ? 'bg-destructive/30' : 
            isSkipped ? 'bg-amber-500/30' :
            'bg-border/30'
          )}
        />
      )}

      {/* Circle Icon */}
      <div className="relative z-10 flex size-6.5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 mt-0.5">
        {isCompleted && (
          <div className="flex size-full items-center justify-center rounded-full bg-emerald-500/10 border-emerald-500/35 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <Check className="size-3.5 stroke-[3]" />
          </div>
        )}
        {isActive && (
          <div className="flex size-full items-center justify-center rounded-full bg-primary/10 border-primary/40 text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)] animate-pulse">
            <Loader2 className="size-3.5 animate-spin" />
          </div>
        )}
        {isFailed && (
          <div className="flex size-full items-center justify-center rounded-full bg-destructive/10 border-destructive/30 text-destructive">
            <X className="size-3.5 stroke-[2.5]" />
          </div>
        )}
        {isSkipped && (
          <div className="flex size-full items-center justify-center rounded-full bg-amber-500/10 border-amber-500/35 text-amber-500">
            <AlertCircle className="size-3.5" />
          </div>
        )}
        {status === 'pending' && (
          <div className="flex size-full items-center justify-center rounded-full bg-card border-border/60 text-muted-foreground/50">
            <div className="size-1.5 rounded-full bg-border" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={cn(
              'text-[12px] font-bold tracking-tight transition-colors',
              isActive ? 'text-primary' : isSkipped ? 'text-amber-600' : 'text-foreground'
            )}
          >
            {title}
          </h4>
          {timestamp && (
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <p
          className={cn(
            'text-[11px] leading-relaxed transition-colors',
            isActive ? 'text-foreground/90' : 'text-muted-foreground'
          )}
        >
          {description}
        </p>

        {details && (
          <ConditionDetails details={details} triggerName={triggerName} status={status} />
        )}
      </div>
    </div>
  )
}

interface EventTimelineProps {
  event: SimulationEvent
}

export function EventTimeline({ event }: EventTimelineProps) {
  const { status, createdAt, timeline: apiTimeline, processingError } = event

  // Safely parse processingError
  const parsedError = React.useMemo(() => {
    if (!processingError) return null
    try {
      return JSON.parse(processingError)
    } catch (e) {
      console.error('Failed to parse processingError', e)
      return null
    }
  }, [processingError])

  const timelineSteps: TimelineStepData[] = (parsedError?.timeline || apiTimeline || []) as TimelineStepData[]

  // If timeline exists, use it to render steps
  if (timelineSteps && timelineSteps.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 border-b border-border/20 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
              Automation Execution Timeline
            </h3>
            {status === 'PENDING' || status === 'PROCESSING' ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 rounded-full px-2.5 py-1 animate-pulse">
                <Loader2 className="size-3 animate-spin" />
                <span>Workflow running...</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-muted-foreground bg-muted/30 border border-border/40 rounded-full px-2.5 py-1">
                Completed
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Understand exactly what happened during event processing
          </p>
        </div>

        <div className="pl-1 pt-2">
          {timelineSteps.map((step, idx) => {
            let stepStatus: TimelineStepProps['status'] = 'pending'
            if (step.status === 'SUCCESS') stepStatus = 'completed'
            else if (step.status === 'FAILED') stepStatus = 'failed'
            else if (step.status === 'SKIPPED') stepStatus = 'skipped'
            else if (step.status === 'PENDING') stepStatus = 'active'

            // Format step name for display
            const title = step.step
              .toLowerCase()
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')

            return (
              <TimelineStep
                key={idx}
                title={title}
                description={step.message}
                status={stepStatus}
                details={step.details}
                triggerName={step.triggerName}
                isLast={idx === timelineSteps.length - 1}
                timestamp={idx === 0 ? createdAt : undefined}
              />
            )
          })}
        </div>
      </div>
    )
  }

  // Handle PENDING state with no timeline
  if (status === 'PENDING' || status === 'PROCESSING') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 border-b border-border/20 pb-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
            Automation Execution Timeline
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Understand exactly what happened during event processing
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div className="p-3 rounded-full bg-primary/5 border border-primary/10 animate-pulse">
            <Loader2 className="size-6 text-primary animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Processing Event...</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              The automation engine is currently executing workflow rules for this event.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Fallback if no timeline and not pending
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-border/20 pb-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
          Automation Execution Timeline
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Understand exactly what happened during event processing
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 grayscale opacity-60">
        <HelpCircle className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">No Timeline Available</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            No automation execution details available for this event run yet.
          </p>
        </div>
      </div>
    </div>
  )
}
export default EventTimeline
