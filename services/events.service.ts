import { apiClient } from '@/lib/axios/apiClient'
import type { SimulationEvent } from '@/types/event'

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
      const response = await apiClient.get<{ success: boolean; data: { items: any[] } }>('/events')
      const items = (response.data.data.items || []).map(item => ({
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
    } catch (e) {
      // If endpoint doesn't exist or fails, return empty list gracefully
      return { data: [], total: 0 }
    }
  },

  getById: async (id: string): Promise<SimulationEvent> => {
    const eventResponse = await apiClient.get<{ success: boolean; data: any }>(`/events/${id}`)
    const eventData = eventResponse.data.data

    // 2. Fetch jobs and filter by this event id
    let jobs: any[] = []
    try {
      const jobsResponse = await apiClient.get<{ success: boolean; data: { items: any[] } }>('/jobs')
      const allJobs = jobsResponse.data.data.items || []
      jobs = allJobs
        .filter(j => j.eventId === id || j.event?.id === id)
        .map(j => ({
          id: j.id,
          recipientEmail: j.recipientEmail,
          status: (j.status === 'SENT' ? 'SENT' : j.status === 'FAILED' ? 'FAILED' : j.status === 'PENDING' ? 'PENDING' : 'RETRYING') as any,
          retryCount: j.retryCount || 0,
          processedAt: j.processedAt || null,
          templateName: j.template?.name || 'Template',
          triggerName: j.trigger?.name || 'Trigger',
          lastError: j.lastError || undefined,
          provider: j.provider || undefined,
          providerMessageId: j.providerMessageId || undefined,
          sentAt: j.processedAt || undefined,
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
      createdAt: eventData.createdAt,
      updatedAt: eventData.updatedAt,
    }
  },

  getDefinitions: async (): Promise<any[]> => {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/event-definitions')
    return response.data.data
  }
}
