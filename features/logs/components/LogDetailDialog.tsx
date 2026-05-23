'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useRetryLog } from '@/features/logs/hooks/useLogs'
import { formatDate } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Clock, RotateCcw, User, Zap, Mail, Loader2 } from 'lucide-react'
import type { SendLog } from '@/types/log'

interface LogDetailDialogProps {
  log: SendLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogDetailDialog({ log, open, onOpenChange }: LogDetailDialogProps) {
  const { mutate: retryLog, isPending: isRetrying } = useRetryLog()

  if (!log) return null

  const handleRetry = () => {
    retryLog(log.id, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  const isFailed = log.status === 'failed'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <DialogTitle className="text-base font-semibold">Log Detail</DialogTitle>
              <DialogDescription className="text-xs">
                Audit trail for ID: <code className="font-mono bg-muted px-1 rounded">{log.id}</code>
              </DialogDescription>
            </div>
            <StatusBadge status={log.status} />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Recipient Card */}
          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/10 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <User className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Recipient Email</p>
              <p className="font-medium text-foreground">{log.recipient}</p>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Zap className="size-3" /> Trigger Rule
              </span>
              <p className="font-medium text-foreground">{log.triggerName || 'Ad-hoc'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Mail className="size-3" /> Targeted Template
              </span>
              <p className="font-medium text-foreground">{log.templateName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> Event Type
              </span>
              <p className="font-mono text-[10px] text-foreground">{log.eventType || 'N/A'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> Timestamp
              </span>
              <p className="text-foreground">{formatDate(log.sentAt || log.createdAt)}</p>
            </div>
          </div>

          {/* Failure banner */}
          {isFailed && log.errorReason && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 flex gap-3">
              <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-destructive">Delivery Failed</p>
                <p className="text-muted-foreground mt-0.5">{log.errorReason}</p>
              </div>
            </div>
          )}

          {/* Success details */}
          {log.status === 'sent' && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 flex gap-3">
              <CheckCircle className="size-4 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-600 dark:text-green-500">Delivered Successfully</p>
                <p className="text-muted-foreground mt-0.5">
                  The message was handed off to the SMTP server.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRetrying}
          >
            Close
          </Button>
          {isFailed && (
            <Button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="gap-1.5"
            >
              {isRetrying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Retry Send
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
