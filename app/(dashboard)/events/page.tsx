'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { TriggerEventModal } from '@/features/events/components/TriggerEventModal'
import { EventProcessingPanel } from '@/features/events/components/EventProcessingPanel'
import { useEvents } from '@/features/events/hooks/useEvents'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Radio, Play, ChevronRight, Cpu } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { useTriggers } from '@/features/triggers/hooks/useTriggers'

export default function EventsPage() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null)
  const { data: eventsData, isLoading, error, refetch } = useEvents()

  const { data: templatesData } = useTemplates({ page: 1, pageSize: 1 })
  const { data: triggersData } = useTriggers()

  const hasTemplates = (templatesData?.total ?? 0) > 0
  const hasTriggers = (triggersData?.data?.length ?? 0) > 0
  const canSimulate = hasTemplates && hasTriggers

  if (selectedEventId) {
    return (
      <div className="space-y-6">
        <EventProcessingPanel
          eventId={selectedEventId}
          onBack={() => {
            setSelectedEventId(null)
            refetch()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Event Simulation"
        description="Trigger mock events and visually audit real-time workflow orchestration pipelines."
      >
        {canSimulate && (
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="font-semibold shadow-xs gap-1.5"
          >
            <Play className="size-3.5 fill-current" />
            Trigger Simulation
          </Button>
        )}
      </PageHeader>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error || !eventsData?.data.length ? (
        <EmptyState
          icon={Radio}
          title="No Simulation Runs Yet"
          description={
            canSimulate
              ? "Trigger your first event simulation to watch matching triggers, conditions, and templates run in real time."
              : "You need at least one active template and one trigger to simulate an event run."
          }
          action={
            canSimulate
              ? {
                  label: 'Trigger Event Simulation',
                  onClick: () => setModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <Card className="bg-card/30 border-border/50 backdrop-blur-xs">
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {eventsData.data.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-all gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
                      <Cpu className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {event.eventType}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        Run ID: {event.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </span>
                    <StatusBadge status={event.status} />
                    <ChevronRight className="size-4 text-muted-foreground/50" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trigger Dialog */}
      <TriggerEventModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
