import { nextClient } from '@/lib/axios/nextClient'
import type { ConditionGroup } from '@/types/trigger'

export interface SubjectVariant {
  subject: string
  tone: string
}

export interface PlaceholderValidation {
  valid: string[]
  missing: string[]
  extra: string[]
}

export const aiService = {
  generateSubjectVariants: async (subject: string) => {
    const response = await nextClient.post<SubjectVariant[]>('/api/ai/subject-variants', { subject })
    return response.data
  },

  toneRewrite: async (text: string, tone: string) => {
    const response = await nextClient.post<{ rewritten: string }>('/api/ai/tone-rewrite', { text, tone })
    return response.data
  },

  validatePlaceholders: async (html: string, eventType: string) => {
    const response = await nextClient.post<PlaceholderValidation>('/api/ai/placeholder-validate', {
      html,
      eventType,
    })
    return response.data
  },

  explainConditions: async (conditions: ConditionGroup) => {
    const response = await nextClient.post<{ explanation: string }>('/api/ai/condition-suggest', {
      conditions,
    })
    return response.data
  },

  generateTrigger: async (prompt: string, events: any[], templates: any[]) => {
    const response = await nextClient.post<any>('/api/ai/trigger-generate', { prompt, events, templates })
    return response.data
  },

  fixTemplateVariables: async (html: string, extraVariables: string[], availableVariables: string[]) => {
    const response = await nextClient.post<{ htmlContent: string; mappings: Array<{ from: string; to: string }> }>('/api/ai/template-fix-variables', { html, extraVariables, availableVariables })
    return response.data
  },

  suggestConditions: async (eventType: string, fields: any[], description?: string) => {
    const response = await nextClient.post<{ suggestions: Array<{ label: string; conditions: ConditionGroup }> }>('/api/ai/condition-suggest-rules', { eventType, fields, description })
    return response.data
  },
}
