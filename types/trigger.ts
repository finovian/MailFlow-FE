

import type { EventType } from '@/constants/eventTypes'

export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'not_within_days'
  | 'is_true'
  | 'is_false'


export type TriggerStatus = 'ACTIVE' | 'INACTIVE' | 'active' | 'inactive'


export interface ConditionRule {
  field: string
  op: Operator
  value: string | number | boolean
}


export interface ConditionGroup {
  operator: 'AND' | 'OR'
  rules: (ConditionRule | ConditionGroup)[]
}


export interface Trigger {
  id: string
  name: string
  eventType: EventType
  conditions: ConditionGroup
  templateId: string
  templateName?: string
  template?: {
    id: string
    name: string
  }
  recipientField: string
  cooldownDays: number
  sendOnce: boolean
  status: TriggerStatus
  lastFiredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTriggerDto {
  name: string
  eventType: EventType
  conditions: ConditionGroup
  templateId: string
  recipientField: string
  cooldownDays: number
  sendOnce: boolean
  status?: TriggerStatus
}


export interface UpdateTriggerDto extends Partial<CreateTriggerDto> { }
