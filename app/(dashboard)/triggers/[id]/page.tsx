'use client'

import * as React from 'react'
import { useTrigger } from '@/features/triggers/hooks/useTriggers'
import { TriggerForm } from '@/features/triggers/components/TriggerForm'
import { Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TriggerEditPage({ params }: PageProps) {
  const { id } = React.use(params)
  const { data: trigger, isLoading, error } = useTrigger(id)

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !trigger) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <p className="text-destructive font-medium">Failed to load trigger</p>
        <p className="text-xs text-muted-foreground">
          {error instanceof Error ? error.message : 'Trigger not found'}
        </p>
      </div>
    )
  }

  return <TriggerForm initialData={trigger} />
}
