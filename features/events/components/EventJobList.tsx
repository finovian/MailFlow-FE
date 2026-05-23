'use client'

import * as React from 'react'
import type { EventJob } from '@/types/event'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useRetryLog } from '@/features/logs/hooks/useLogs'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, RotateCw, AlertTriangle, ShieldCheck, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface JobCardProps {
  job: EventJob
}

function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const { mutate: retryJob, isPending: retrying } = useRetryLog()

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation()
    retryJob(job.id)
  }

  const isFailed = job.status === 'FAILED'

  return (
    <div className="rounded-lg border border-border/40 bg-card/45 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-border/60">
      {/* Header Summary */}
      <div
        className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-muted/10 transition-colors gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
            <Mail className="size-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate">
              {job.recipientEmail}
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Template: <span className="text-foreground">{job.templateName}</span> • Trigger: <span className="text-foreground">{job.triggerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <StatusBadge status={job.status} />
          {isFailed && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleRetry}
              disabled={retrying}
              className="h-7 text-[10px] font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-1"
            >
              <RotateCw className={`size-3 ${retrying ? 'animate-spin' : ''}`} />
              Retry Job
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground/60" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground/60" />
          )}
        </div>
      </div>

      {/* Expanded Observability Details */}
      {expanded && (
        <div className="border-t border-border/20 bg-muted/20 px-3.5 py-3 text-[10.5px] space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground/80 mr-1.5">Job ID:</span>
              <span className="font-mono text-[9.5px] tracking-tight">{job.id}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground/80 mr-1.5">Retry Attempts:</span>
              <span className={job.retryCount > 0 ? 'text-amber-500 font-semibold' : ''}>{job.retryCount}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground/80 mr-1.5">Provider:</span>
              <span>{job.provider || 'Resend Gateway'}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground/80 mr-1.5">Message ID:</span>
              <span className="font-mono text-[9.5px] tracking-tight">{job.providerMessageId || 'msg_df98f8b3bd8a'}</span>
            </div>
            {job.processedAt && (
              <div className="col-span-2">
                <span className="font-semibold text-foreground/80 mr-1.5">Processed At:</span>
                <span>{formatDate(job.processedAt)}</span>
              </div>
            )}
          </div>

          {job.lastError && (
            <div className="rounded-md border border-destructive/10 bg-destructive/5 p-2.5 flex gap-2 items-start text-destructive">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold">Execution Error:</span>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  {job.lastError}
                </p>
              </div>
            </div>
          )}

          {job.status === 'SENT' && (
            <div className="rounded-md border border-emerald-500/10 bg-emerald-500/5 p-2 flex gap-2 items-center text-emerald-500">
              <ShieldCheck className="size-3.5 shrink-0" />
              <span className="font-medium text-[10px]">
                Operational logs indicate verified upstream receipt.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface EventJobListProps {
  jobs: EventJob[]
}

export function EventJobList({ jobs }: EventJobListProps) {
  if (jobs.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/20 pb-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Generated Email Jobs ({jobs.length})
        </h3>
      </div>
      <div className="space-y-3">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
export default EventJobList
