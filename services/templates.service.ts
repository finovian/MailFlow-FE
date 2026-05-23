import { apiClient } from '@/lib/axios/apiClient'
import type {
  Template,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateListParams,
  TestSendDto,
} from '@/types/template'
import type { PaginatedResponse } from '@/types/api'

export const templatesService = {
  getAll: async (params?: TemplateListParams) => {
    // Translate statuses to uppercase for the backend
    const apiParams = params ? {
      ...params,
      status: params.status && params.status !== 'all' ? params.status.toUpperCase() : undefined
    } : undefined

    const response = await apiClient.get<{ success: boolean; data: { items: Template[]; total: number; page: number; limit: number; hasMore: boolean } }>('/templates', { params: apiParams })

    // Map items to inject htmlContent for compatibility
    const items = (response.data.data.items || []).map(item => ({
      ...item,
      htmlContent: item.bodyHtml || '',
      status: (item.status || 'draft').toLowerCase() as any
    }))

    const result: PaginatedResponse<Template> = {
      data: items,
      total: response.data.data.total,
      page: response.data.data.page,
      pageSize: response.data.data.limit,
      totalPages: Math.ceil(response.data.data.total / response.data.data.limit)
    }
    return result
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; message: string; data: Template }>(`/templates/${id}`)
    const item = response.data.data
    return {
      ...item,
      htmlContent: item.bodyHtml || '',
      status: (item.status || 'draft').toLowerCase() as any
    }
  },

  create: async (data: CreateTemplateDto) => {
    const payload = {
      name: data.name,
      subject: data.subject,
      bodyHtml: data.htmlContent,
      description: data.description,
      status: data.status ? data.status.toUpperCase() : undefined
    }
    const response = await apiClient.post<{ success: boolean; message: string; data: Template }>('/templates', payload)
    const item = response.data.data
    return {
      ...item,
      htmlContent: item.bodyHtml || '',
      status: (item.status || 'draft').toLowerCase() as any
    }
  },

  update: async (id: string, data: UpdateTemplateDto) => {
    const payload = {
      name: data.name,
      subject: data.subject,
      bodyHtml: data.htmlContent,
      description: data.description,
      status: data.status ? data.status.toUpperCase() : undefined
    }
    const response = await apiClient.patch<{ success: boolean; message: string; data: Template }>(`/templates/${id}`, payload)
    const item = response.data.data
    return {
      ...item,
      htmlContent: item.bodyHtml || '',
      status: (item.status || 'draft').toLowerCase() as any
    }
  },

  delete: async (id: string) => {
    await apiClient.delete(`/templates/${id}`)
  },

  testSend: async (id: string, payload: TestSendDto) => {
    const response = await apiClient.post(`/templates/${id}/test-send`, payload)
    return response.data
  },
}
