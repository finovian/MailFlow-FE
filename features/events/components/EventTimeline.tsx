'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check, Loader2, X, AlertCircle, Info, HelpCircle } from 'lucide-react'
import type { SimulationEvent } from '@/types/event'

interface TimelineStepProps {
  title: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped'
  timestamp?: string
  isLast?: boolean
}

function TimelineStep({ title, description, status, timestamp, isLast }: TimelineStepProps) {
  const isCompleted = status === 'completed'
  const isActive = status === 'active'
  const isFailed = status === 'failed'
  const isSkipped = status === 'skipped'

  return (
    <div className="relative flex gap-4 pb-6 group">
      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-3 top-6 bottom-0 w-0.5 transition-colors duration-300',
            isCompleted ? 'bg-emerald-500/50' : isFailed ? 'bg-destructive/50' : 'bg-border/40'
          )}
        />
      )}

      {/* Circle Icon */}
      <div className="relative z-10 flex size-6.5 shrink-0 items-center justify-center rounded-full border transition-all duration-300">
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
          <div className="flex size-full items-center justify-center rounded-full bg-muted border-border/80 text-muted-foreground">
            <Info className="size-3.5" />
          </div>
        )}
        {status === 'pending' && (
          <div className="flex size-full items-center justify-center rounded-full bg-card border-border/60 text-muted-foreground/50">
            <div className="size-1.5 rounded-full bg-border" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-0.5 pt-0.5 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={cn(
              'text-xs font-semibold tracking-tight transition-colors',
              isActive ? 'text-primary' : isSkipped ? 'text-muted-foreground/80' : 'text-foreground'
            )}
          >
            {title}
          </h4>
          {timestamp && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <p
          className={cn(
            'text-[10.5px] leading-relaxed transition-colors',
            isActive ? 'text-foreground/90' : 'text-muted-foreground'
          )}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

interface EventTimelineProps {
  event: SimulationEvent
}

export function EventTimeline({ event }: EventTimelineProps) {
  const { status, matchedTriggers, jobs, createdAt } = event

  const anyTriggerMatched = matchedTriggers.some(t => t.matched)
  const isTriggersEvaluated = status !== 'PENDING'
  const isFinished = status === 'COMPLETED' || status === 'FAILED'

  // Step 1: Event Received
  const step1Status = 'completed'

  // Step 2: Workflow Orchestration
  let step2Status: TimelineStepProps['status'] = 'pending'
  if (status === 'PENDING') {
    step2Status = 'active'
  } else {
    step2Status = 'completed'
  }

  // Step 3: Trigger Evaluation
  let step3Status: TimelineStepProps['status'] = 'pending'
  let step3Desc = 'Evaluating event payload against active trigger criteria.'
  if (status === 'PENDING') {
    step3Status = 'pending'
  } else if (status === 'PROCESSING') {
    step3Status = 'active'
    step3Desc = `Scanning trigger conditions...`
  } else {
    step3Status = 'completed'
    if (matchedTriggers.length === 0) {
      step3Desc = 'No trigger match was found in the database.'
    } else {
      const matchCount = matchedTriggers.filter(t => t.matched).length
      step3Desc = `${matchCount} of ${matchedTriggers.length} trigger(s) matched condition criteria.`
    }
  }

  // Step 4: Job Generation
  let step4Status: TimelineStepProps['status'] = 'pending'
  let step4Desc = 'Generate email tasks for each matching trigger.'
  if (!isTriggersEvaluated) {
    step4Status = 'pending'
  } else if (status === 'PROCESSING') {
    step4Status = 'active'
  } else {
    // Finished
    if (matchedTriggers.length > 0 && !anyTriggerMatched) {
      step4Status = 'skipped'
      step4Desc = 'Skipped. No active trigger conditions matched the event payload.'
    } else if (jobs.length > 0) {
      step4Status = 'completed'
      step4Desc = `Successfully created ${jobs.length} email dispatch job(s).`
    } else {
      step4Status = 'skipped'
      step4Desc = 'No matching triggers were evaluated.'
    }
  }

  // Step 5: Email Dispatched
  let step5Status: TimelineStepProps['status'] = 'pending'
  let step5Desc = 'Render template placeholders and deliver via provider gateway.'
  if (step4Status === 'skipped') {
    step5Status = 'skipped'
    step5Desc = 'Skipped. No email jobs generated.'
  } else if (status === 'PROCESSING') {
    step5Status = 'pending'
  } else if (isFinished) {
    const failedJobs = jobs.filter(j => j.status === 'FAILED')
    const retryingJobs = jobs.filter(j => j.status === 'RETRYING')

    if (failedJobs.length > 0 && retryingJobs.length === 0) {
      step5Status = 'failed'
      step5Desc = `Delivery failed for ${failedJobs.length} recipient(s).`
    } else if (retryingJobs.length > 0) {
      step5Status = 'active'
      step5Desc = `Retrying failed delivery attempts...`
    } else if (jobs.length > 0) {
      step5Status = 'completed'
      step5Desc = `All emails successfully sent to upstream delivery providers.`
    } else {
      step5Status = 'skipped'
    }
  }

  // Step 6: Delivery Audit Trail
  let step6Status: TimelineStepProps['status'] = 'pending'
  let step6Desc = 'Commit final logs and archive workflow run.'
  if (step5Status === 'skipped') {
    step6Status = 'skipped'
    step6Desc = 'Orchestration finalized. No dispatch operations performed.'
  } else if (isFinished) {
    if (step5Status === 'failed') {
      step6Status = 'failed'
      step6Desc = 'Audit logged. Operations completed with errors.'
    } else {
      step6Status = 'completed'
      step6Desc = 'Audit logged. Campaign run successfully archived.'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border/20 pb-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Automation Timeline
        </h3>
        {status === 'PENDING' || status === 'PROCESSING' ? (
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary bg-primary/5 border border-primary/10 rounded-full px-2 py-0.5 animate-pulse">
            <Loader2 className="size-3 animate-spin" />
            <span>Workflow running...</span>
          </div>
        ) : (
          <div className="text-[10px] font-semibold text-muted-foreground bg-muted/30 border border-border/40 rounded-full px-2 py-0.5">
            Archived
          </div>
        )}
      </div>

      <div className="pl-1">
        <TimelineStep
          title="Event Ingested"
          description="Payload successfully parsed and stored in DB with idempotency verification."
          status={step1Status}
          timestamp={createdAt}
        />
        <TimelineStep
          title="Inngest Workflow Triggered"
          description="Asynchronous orchestration thread spawned from message broker queue."
          status={step2Status}
        />
        <TimelineStep
          title="Conditions Evaluated"
          description={step3Desc}
          status={step3Status}
        />
        <TimelineStep
          title="Email Jobs Created"
          description={step4Desc}
          status={step4Status}
        />
        <TimelineStep
          title="Emails Sent"
          description={step5Desc}
          status={step5Status}
        />
        <TimelineStep
          title="Audit Trail Logged"
          description={step6Desc}
          status={step6Status}
          isLast
        />
      </div>

      {/* No Trigger Matched Alert State */}
      {isFinished && matchedTriggers.length > 0 && !anyTriggerMatched && (
        <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3.5 flex gap-2.5 items-start">
          <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-semibold text-amber-500">
              Simulation Completed: No Trigger Matched
            </h5>
            <p className="text-[10.5px] leading-relaxed text-muted-foreground">
              This event was received and processed successfully by the automation engine. However, the payload did not meet the conditional rule requirements of any active triggers. This is a <strong>valid orchestration path</strong> and no further jobs were queued.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
export default EventTimeline
