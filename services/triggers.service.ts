import { apiClient } from '@/lib/axios/apiClient'
import type {
  Trigger,
  CreateTriggerDto,
  UpdateTriggerDto,
} from '@/types/trigger'
import type { PaginatedResponse } from '@/types/api'

export interface TriggerListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  eventType?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export const triggersService = {
  getAll: async (params?: TriggerListParams) => {
    const apiParams = params ? {
      page: params.page,
      limit: params.pageSize,
      search: params.search || undefined,
      status: params.status && params.status !== 'all' ? params.status.toUpperCase() : undefined,
      eventType: params.eventType || undefined,
    } : undefined

    const response = await apiClient.get<{ success: boolean; data: { items: Trigger[]; total: number; page: number; limit: number; hasMore: boolean } }>('/triggers', { params: apiParams })
    
    const items = (response.data.data.items || []).map(item => ({
      ...item,
      templateId: item.template?.id || item.templateId || '',
      templateName: item.template?.name || item.templateName || '',
      status: (item.status || 'inactive').toLowerCase() as any
    }))

    const result: PaginatedResponse<Trigger> = {
      data: items,
      total: response.data.data.total,
      page: response.data.data.page,
      pageSize: response.data.data.limit,
      totalPages: Math.ceil(response.data.data.total / response.data.data.limit)
    }
    return result
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; message: string; data: Trigger }>(`/triggers/${id}`)
    const item = response.data.data
    return {
      ...item,
      templateId: item.template?.id || item.templateId || '',
      templateName: item.template?.name || item.templateName || '',
      status: (item.status || 'inactive').toLowerCase() as any
    }
  },

  create: async (data: CreateTriggerDto) => {
    const payload = {
      name: data.name,
      eventType: data.eventType,
      templateId: data.templateId,
      recipientField: data.recipientField,
      sendOnce: data.sendOnce,
      cooldownDays: data.cooldownDays,
      conditions: data.conditions,
      status: data.status ? data.status.toUpperCase() : undefined
    }
    const response = await apiClient.post<{ success: boolean; message: string; data: Trigger }>('/triggers', payload)
    const item = response.data.data
    return {
      ...item,
      templateId: item.template?.id || item.templateId || '',
      templateName: item.template?.name || item.templateName || '',
      status: (item.status || 'inactive').toLowerCase() as any
    }
  },

  update: async (id: string, data: UpdateTriggerDto) => {
    const payload = {
      name: data.name,
      eventType: data.eventType,
      templateId: data.templateId,
      recipientField: data.recipientField,
      sendOnce: data.sendOnce,
      cooldownDays: data.cooldownDays,
      conditions: data.conditions,
      status: data.status ? data.status.toUpperCase() : undefined
    }
    const response = await apiClient.patch<{ success: boolean; message: string; data: Trigger }>(`/triggers/${id}`, payload)
    const item = response.data.data
    return {
      ...item,
      templateId: item.template?.id || item.templateId || '',
      templateName: item.template?.name || item.templateName || '',
      status: (item.status || 'inactive').toLowerCase() as any
    }
  },

  delete: async (id: string) => {
    await apiClient.delete(`/triggers/${id}`)
  },
}
