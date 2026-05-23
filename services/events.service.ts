import { apiClient } from '@/lib/axios/apiClient'
import type { SimulationEvent, EventApiResponse, EventJob, JobStatus } from '@/types/event'
import type { EventDefinition } from '@/config/event-definitions'

export interface FireEventPayload {
  eventType: string
  idempotencyKey: string
  payload: Record<string, unknown>
}

export const eventsService = {
  fire: async (event: FireEventPayload): Promise<{ success: boolean; data: { id: string } }> => {
    const response = await apiClient.post('/events', event)
    return response.data
  },

  getAll: async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { items: EventApiResponse[] } }>('/events')
      const items: SimulationEvent[] = (response.data.data.items || []).map(item => ({
        id: item.id,
        eventType: item.eventType,
        status: item.status || 'COMPLETED',
        payload: item.payload || {},
        matchedTriggers: item.matchedTriggers || [],
        jobs: [],
        jobCount: item.jobCount || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      return { data: items, total: items.length }
    } catch {
      // If endpoint doesn't exist or fails, return empty list gracefully
      return { data: [], total: 0 }
    }
  },

  getById: async (id: string): Promise<SimulationEvent> => {
    const eventResponse = await apiClient.get<{ success: boolean; data: EventApiResponse }>(`/events/${id}`)
    const eventData = eventResponse.data.data

    // 2. Fetch jobs and filter by this event id
    let jobs: EventJob[] = []
    try {
      const jobsResponse = await apiClient.get<{ success: boolean; data: { items: Array<Record<string, unknown>> } }>('/jobs')
      const allJobs = jobsResponse.data.data.items || []
      jobs = allJobs
        .filter(j => j.eventId === id || (j.event as Record<string, unknown>)?.id === id)
        .map(j => ({
          id: j.id as string,
          recipientEmail: j.recipientEmail as string,
          status: (j.status === 'SENT' ? 'SENT' : j.status === 'FAILED' ? 'FAILED' : j.status === 'PENDING' ? 'PENDING' : 'RETRYING') as JobStatus,
          retryCount: (j.retryCount as number) || 0,
          processedAt: (j.processedAt as string) || null,
          templateName: (j.template as Record<string, string>)?.name || 'Template',
          triggerName: (j.trigger as Record<string, string>)?.name || 'Trigger',
          lastError: (j.lastError as string) || undefined,
          provider: (j.provider as string) || undefined,
          providerMessageId: (j.providerMessageId as string) || undefined,
          sentAt: (j.processedAt as string) || undefined,
        }))
    } catch (e) {
      console.warn('Failed to fetch jobs for event', e)
    }

    return {
      id: eventData.id,
      eventType: eventData.eventType,
      status: eventData.status || 'COMPLETED',
      payload: eventData.payload || {},
      matchedTriggers: eventData.matchedTriggers || [],
      jobs,
      jobCount: jobs.length,
      error: eventData.error,
      processingError: eventData.processingError,
      createdAt: eventData.createdAt,
      updatedAt: eventData.updatedAt,
    }
  },

  getDefinitions: async (): Promise<EventDefinition[]> => {
    const response = await apiClient.get<{ success: boolean; data: EventDefinition[] }>('/event-definitions')
    return response.data.data
  }
}
