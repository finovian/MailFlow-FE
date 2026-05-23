import { useMutation } from '@tanstack/react-query'
import { aiService } from '@/services/ai.service'

export function useGenerateTrigger() {
  return useMutation({
    mutationFn: ({ prompt, events, templates }: { prompt: string; events: readonly any[]; templates: readonly any[] }) =>
      aiService.generateTrigger(prompt, events as any[], templates as any[]),
  })
}

export function useFixTemplateVariables() {
  return useMutation({
    mutationFn: ({
      html,
      extraVariables,
      availableVariables,
    }: {
      html: string
      extraVariables: string[]
      availableVariables: string[]
    }) => aiService.fixTemplateVariables(html, extraVariables, availableVariables),
  })
}

export function useSuggestConditions() {
  return useMutation({
    mutationFn: ({
      eventType,
      fields,
      description,
    }: {
      eventType: string
      fields: readonly any[]
      description?: string
    }) => aiService.suggestConditions(eventType, fields as any[], description),
  })
}

