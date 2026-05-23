/**
 * lib/eventRegistry.ts
 *
 * Registry utility functions — derive everything from EVENT_DEFINITIONS.
 * This is the ONLY place that imports from config/event-definitions.
 * All other modules import from here.
 */

import { EVENT_DEFINITIONS, type EventDefinition, type EventFieldDef } from '@/config/event-definitions'

// Module-level cache for dynamic/runtime event definitions, fallback to static config
let runtimeDefinitions: EventDefinition[] = [...EVENT_DEFINITIONS]

/** Allow updating the definitions at runtime (e.g. after fetching from backend) */
export function setRuntimeDefinitions(defs: EventDefinition[]): void {
  runtimeDefinitions = defs
}

// ─── Core lookups ─────────────────────────────────────────────────────────────

/** Return the full definition for a given event type, or undefined. */
export function getEventDefinition(type: string): EventDefinition | undefined {
  return runtimeDefinitions.find((e) => e.type === type)
}

/** Return all event definitions (read-only). */
export function getAllEventDefinitions(): readonly EventDefinition[] {
  return runtimeDefinitions
}

// ─── Field helpers ────────────────────────────────────────────────────────────

/**
 * Return the flat list of payload fields for a given event type.
 * Matches the legacy `getFieldsForEventType` shape so ConditionBuilder works unchanged.
 */
export function getEventFields(type: string): readonly EventFieldDef[] {
  return getEventDefinition(type)?.fields ?? []
}

/**
 * Recursively flatten a nested payloadSchema object into dot-notation paths.
 * Example: { user: { name: "string", email: "string" } } => ["user.name", "user.email"]
 */
export function flattenPayloadSchema(
  schema: Record<string, unknown>,
  prefix = '',
): string[] {
  const result: string[] = []
  for (const [key, value] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result.push(...flattenPayloadSchema(value as Record<string, unknown>, path))
    } else {
      result.push(path)
    }
  }
  return result
}

/**
 * Return all dot-notation variable paths for a given event type.
 * Used by AI validation and variable autocomplete.
 */
export function getEventPayloadFields(type: string): string[] {
  const def = getEventDefinition(type)
  if (!def) return []
  return flattenPayloadSchema(def.payloadSchema)
}

/** Return the mock payload for a given event type. */
export function getEventMockPayload(type: string): Record<string, unknown> {
  return getEventDefinition(type)?.mockPayload ?? {}
}

// ─── Grouped select helpers ───────────────────────────────────────────────────

export interface EventGroup {
  category: string
  categoryLabel: string
  items: readonly EventDefinition[]
}

/**
 * Return EVENT_DEFINITIONS grouped by category for grouped-select UIs.
 * Preserves insertion order.
 */
export function getEventDefinitionsGrouped(): EventGroup[] {
  const map = new Map<string, { categoryLabel: string; items: EventDefinition[] }>()
  for (const def of runtimeDefinitions) {
    if (!map.has(def.category)) {
      map.set(def.category, { categoryLabel: def.categoryLabel, items: [] })
    }
    map.get(def.category)!.items.push(def as EventDefinition)
  }
  return Array.from(map.entries()).map(([category, { categoryLabel, items }]) => ({
    category,
    categoryLabel,
    items,
  }))
}

/**
 * Flat list of { value, label } pairs — drop-in replacement for the legacy
 * EVENT_TYPES array used in plain (non-grouped) Select components.
 */
export function getEventTypeOptions(): { value: string; label: string }[] {
  return runtimeDefinitions.map((e) => ({ value: e.type, label: e.label }))
}

// ─── Re-exports for convenience ────────────────────────────────────────────────
export type { EventDefinition, EventFieldDef }
