export type EventStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type JobStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RETRYING'

export interface EventJob {
  id: string
  recipientEmail: string
  status: JobStatus
  retryCount: number
  processedAt: string | null
  templateName: string
  triggerName: string
  lastError?: string
  provider?: string
  providerMessageId?: string
  sentAt?: string
}

export interface MatchedTrigger {
  id: string
  name: string
  matched: boolean
  reason?: string
}

export interface SimulationEvent {
  id: string
  eventType: string
  status: EventStatus
  payload: Record<string, unknown>
  matchedTriggers: MatchedTrigger[]
  jobs: EventJob[]
  jobCount: number
  createdAt: string
  updatedAt: string
}
