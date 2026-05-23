
import { z } from 'zod'
import { EVENT_TYPE_VALUES } from '@/constants/eventTypes'
import { OPERATORS } from '@/constants/operators'
import type { ConditionRule, ConditionGroup, CreateTriggerDto, UpdateTriggerDto } from '@/types/trigger'


const operatorValues = OPERATORS.map((op) => op.value) as [string, ...string[]]


const eventTypeValues = EVENT_TYPE_VALUES as unknown as [string, ...string[]]


export const conditionRuleSchema: z.ZodType<ConditionRule> = z.object({
  field: z.string().min(1, 'Field is required'),
  op: z.enum(operatorValues) as any,
  value: z.union([z.string(), z.number(), z.boolean()]),
})

export const conditionGroupSchema: z.ZodType<ConditionGroup> = z.lazy(() => z.object({
  operator: z.enum(['AND', 'OR']).default('AND'),
  rules: z.array(z.lazy(() => z.union([conditionRuleSchema, conditionGroupSchema]))).default([]),
}))


const baseCreateTriggerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  eventType: z.enum(eventTypeValues) as any,
  conditions: conditionGroupSchema.optional().default({ operator: 'AND', rules: [] }) as any,
  templateId: z.string().min(1, 'Template is required'),
  recipientField: z.string().min(1, 'Recipient field is required'),
  cooldownDays: z.number().min(0, 'Cooldown must be 0 or greater').optional().default(0),
  sendOnce: z.boolean().optional().default(false),
  status: z.enum(['active', 'inactive', 'ACTIVE', 'INACTIVE']).optional().default('active') as any,
})

export const createTriggerSchema = baseCreateTriggerSchema as unknown as z.ZodType<CreateTriggerDto>


export type CreateTriggerFormValues = CreateTriggerDto


export const updateTriggerSchema = baseCreateTriggerSchema.partial() as unknown as z.ZodType<UpdateTriggerDto>


export type UpdateTriggerFormValues = UpdateTriggerDto

