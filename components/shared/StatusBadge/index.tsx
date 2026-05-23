import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Status = 'active' | 'draft' | 'inactive' | 'sent' | 'failed' | 'pending' | 'retrying' | 'processing' | 'completed'

interface StatusBadgeProps {
  status: string // Keep as string to handle arbitrary uppercase/lowercase shapes
}

const statusConfig: Record<Status, { label: string; className: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    variant: 'outline',
  },
  sent: {
    label: 'Sent',
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    variant: 'outline',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    variant: 'outline',
  },
  draft: {
    label: 'Draft',
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    variant: 'outline',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    variant: 'outline',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse',
    variant: 'outline',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-muted text-muted-foreground border-border',
    variant: 'outline',
  },
  failed: {
    label: 'Failed',
    className: '',
    variant: 'destructive',
  },
  retrying: {
    label: 'Retrying',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    variant: 'outline',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // Translate backend uppercase / custom values to lowercase standard UI states
  const rawLower = status ? status.toLowerCase() : 'draft'
  
  let resolvedStatus: Status = 'draft'
  if (rawLower === 'active' || rawLower === 'success') {
    resolvedStatus = 'active'
  } else if (rawLower === 'sent') {
    resolvedStatus = 'sent'
  } else if (rawLower === 'completed') {
    resolvedStatus = 'completed'
  } else if (rawLower === 'draft') {
    resolvedStatus = 'draft'
  } else if (rawLower === 'inactive') {
    resolvedStatus = 'inactive'
  } else if (rawLower === 'failed' || rawLower === 'cancelled') {
    resolvedStatus = 'failed'
  } else if (rawLower === 'pending') {
    resolvedStatus = 'pending'
  } else if (rawLower === 'processing') {
    resolvedStatus = 'processing'
  } else if (rawLower === 'retrying') {
    resolvedStatus = 'retrying'
  } else {
    resolvedStatus = 'inactive'
  }

  const config = statusConfig[resolvedStatus]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className)}
    >
      <span
        className={cn(
          'mr-1 inline-block size-1.5 rounded-full',
          resolvedStatus === 'active' || resolvedStatus === 'sent' || resolvedStatus === 'completed'
            ? 'bg-emerald-500'
            : resolvedStatus === 'draft' || resolvedStatus === 'pending'
              ? 'bg-amber-500'
              : resolvedStatus === 'inactive'
                ? 'bg-muted-foreground'
                : resolvedStatus === 'failed'
                  ? 'bg-destructive'
                  : 'bg-blue-500'
        )}
      />
      {config.label}
    </Badge>
  )
}
export default StatusBadge
