import { apiClient } from '@/lib/axios/apiClient'
import type { SendLog, LogListParams } from '@/types/log'
import type { PaginatedResponse } from '@/types/api'

export const logsService = {
  getAll: async (params?: LogListParams) => {
    const apiParams = params ? {
      page: params.page,
      limit: params.pageSize,
      status: params.status && params.status !== 'all' ? params.status.toUpperCase() : undefined,
      recipientEmail: params.search || undefined,
    } : undefined

    const response = await apiClient.get<{ success: boolean; data: { items: any[]; total: number; page: number; limit: number; hasMore: boolean } }>('/jobs', { params: apiParams })
    
    const items = (response.data.data.items || []).map(item => ({
      id: item.id,
      recipient: item.recipientEmail,
      templateId: item.template?.id || '',
      templateName: item.template?.name || 'Ad-hoc Test',
      triggerId: item.trigger?.id || '',
      triggerName: item.trigger?.name || 'Ad-hoc Test',
      eventType: item.event?.eventType || 'N/A',
      status: (item.status === 'SENT' ? 'sent' : item.status === 'FAILED' ? 'failed' : item.status === 'PENDING' ? 'pending' : 'retrying') as any,
      errorReason: item.lastError || undefined,
      sentAt: item.processedAt || item.createdAt,
      createdAt: item.createdAt,
    }))

    const result: PaginatedResponse<SendLog> = {
      data: items,
      total: response.data.data.total,
      page: response.data.data.page,
      pageSize: response.data.data.limit,
      totalPages: Math.ceil(response.data.data.total / response.data.data.limit)
    }
    return result
  },

  retry: async (id: string) => {
    const response = await apiClient.post(`/jobs/${id}/retry`)
    return response.data
  },
}
