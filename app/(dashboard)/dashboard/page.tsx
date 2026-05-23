'use client'

import * as React from 'react'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { useTriggers } from '@/features/triggers/hooks/useTriggers'
import { useLogs } from '@/features/logs/hooks/useLogs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { Mail, Zap, CheckCircle2, AlertTriangle, RefreshCw, TrendingUp, DollarSign, Play, Sparkles, Radio } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import { TriggerEventModal } from '@/features/events/components/TriggerEventModal'

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const { 
    data: templatesData, 
    isLoading: loadingTemplates,
    isError: errorTemplates,
    refetch: refetchTemplates
  } = useTemplates({ page: 1, pageSize: 10 })
  
  const { 
    data: triggersData, 
    isLoading: loadingTriggers,
    isError: errorTriggers,
    refetch: refetchTriggers
  } = useTriggers()
  
  const { 
    data: logsData, 
    isLoading: loadingLogs,
    isError: errorLogs,
    refetch: refetchLogs
  } = useLogs({ page: 1, pageSize: 5 })

  const isError = errorTemplates || errorTriggers || errorLogs
  const isLoading = loadingTemplates || loadingTriggers || loadingLogs

  const handleRetry = () => {
    refetchTemplates()
    refetchTriggers()
    refetchLogs()
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h3 className="mb-1 text-base font-medium text-foreground">
          Failed to load dashboard data
        </h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          There was an error connecting to the API. Please check your connection and try again.
        </p>
        <Button onClick={handleRetry} variant="outline" size="sm">
          <RefreshCw className="mr-1.5 size-4" />
          Retry Loading
        </Button>
      </div>
    )
  }

  // Calculate quick stats
  const totalTemplates = templatesData?.total ?? 0
  const totalTriggers = triggersData?.total ?? 0
  const activeTriggers = triggersData?.data.filter((t) => t.status === 'active').length ?? 0
  const totalLogs = logsData?.total ?? 0

  const hasTemplates = totalTemplates > 0
  const hasTriggers = totalTriggers > 0
  const canSimulate = hasTemplates && hasTriggers

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          description="Email delivery overview."
        />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 border-border/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Total Templates
            </CardTitle>
            <Mail className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingTemplates ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{totalTemplates}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Templates configured for campaign triggers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Active Triggers
            </CardTitle>
            <Zap className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingTriggers ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">
                {activeTriggers} <span className="text-sm font-normal text-muted-foreground">/ {totalTriggers}</span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Active automated trigger conditions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Total Sent
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{totalLogs}</div>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Total automation deliveries recorded
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
              Delivery Success
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Average delivery SLA performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Simulation Quick Actions */}
      {canSimulate && (
        <Card className="bg-card/25 border-border/50 backdrop-blur-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-primary animate-pulse" />
              Automation Live Testing
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed max-w-2xl">
              Test and verify the entire end-to-end event-driven orchestration system without any external tools. Inject user events, monitor condition checks, verify template rendering, and inspect raw API payloads.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              type="button"
              onClick={() => setModalOpen(true)}
              size="sm"
              className="font-semibold shadow-xs gap-1.5"
            >
              <Play className="size-3.5 fill-current" />
              Trigger Simulation Flow
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Deliveries */}
      <Card className="bg-card/30 border-border/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Automated Runs</CardTitle>
          <CardDescription className="text-xs">
            Review the status of the most recent email deliveries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-10 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !logsData?.data.length ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No recent automated runs logged yet.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {logsData.data.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">{log.recipient}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Template: <span className="text-foreground">{log.templateName}</span> • Trigger: <span className="text-foreground">{log.triggerName}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(log.sentAt)}
                    </span>
                    <StatusBadge status={log.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <TriggerEventModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
