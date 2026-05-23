import { useMutation } from '@tanstack/react-query'
import { aiService } from '@/services/ai.service'
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

export function useSubjectVariants() {
  return useMutation({
    mutationFn: ({ subject }: { subject: string }) =>
      aiService.generateSubjectVariants(subject),
  })
}

export function useToneRewrite() {
  return useMutation({
    mutationFn: ({ text, tone }: { text: string; tone: string }) =>
      aiService.toneRewrite(text, tone),
  })
}

export function usePlaceholderValidate() {
  return useMutation({
    mutationFn: ({ html, eventType }: { html: string; eventType: string }) =>
      aiService.validatePlaceholders(html, eventType),
  })
}

export function useConditionExplain() {
  return useMutation({
    mutationFn: ({ conditions }: { conditions: ConditionGroup }) =>
      aiService.explainConditions(conditions),
  })
}
