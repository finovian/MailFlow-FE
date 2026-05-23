/**
 * Event type definitions for the Email Automation Platform.
 *
 * Each event type maps to a set of fields available in trigger conditions.
 * Events are grouped by prefix for use in combobox / grouped-select UIs.
 */

/** Descriptor for a single field exposed by an event type. */
export interface EventField {
  readonly name: string
  readonly label: string
  readonly type: 'string' | 'number' | 'boolean' | 'date'
}

/** Descriptor for a single event type. */
export interface EventTypeDescriptor {
  readonly value: string
  readonly label: string
  readonly fields: readonly EventField[]
}

/**
 * Canonical list of every event type the platform recognises.
 * Add new entries here — the rest of the app derives from this array.
 */
export const EVENT_TYPES = [
  {
    value: 'user.created',
    label: 'User Created',
    fields: [
      { name: 'user.email', label: 'Email', type: 'string' },
      { name: 'user.name', label: 'Name', type: 'string' },
      { name: 'user.createdAt', label: 'Created At', type: 'date' },
    ],
  },
  {
    value: 'user.updated',
    label: 'User Updated',
    fields: [
      { name: 'user.email', label: 'Email', type: 'string' },
      { name: 'user.name', label: 'Name', type: 'string' },
      { name: 'user.plan', label: 'Plan', type: 'string' },
    ],
  },
  {
    value: 'user.deleted',
    label: 'User Deleted',
    fields: [
      { name: 'user.email', label: 'Email', type: 'string' },
      { name: 'user.name', label: 'Name', type: 'string' },
    ],
  },
  {
    value: 'event.completed',
    label: 'Event Completed',
    fields: [
      { name: 'event.name', label: 'Event Name', type: 'string' },
      { name: 'event.date', label: 'Event Date', type: 'date' },
      { name: 'event.attendees', label: 'Attendees', type: 'number' },
    ],
  },
  {
    value: 'event.cancelled',
    label: 'Event Cancelled',
    fields: [
      { name: 'event.name', label: 'Event Name', type: 'string' },
      { name: 'event.date', label: 'Event Date', type: 'date' },
      { name: 'event.reason', label: 'Reason', type: 'string' },
    ],
  },
  {
    value: 'event.reminder',
    label: 'Event Reminder',
    fields: [
      { name: 'event.name', label: 'Event Name', type: 'string' },
      { name: 'event.date', label: 'Event Date', type: 'date' },
      { name: 'event.daysUntil', label: 'Days Until Event', type: 'number' },
    ],
  },
  {
    value: 'send_history.bounced',
    label: 'Email Bounced',
    fields: [
      { name: 'send_history.recipient', label: 'Recipient', type: 'string' },
      { name: 'send_history.templateId', label: 'Template ID', type: 'string' },
      { name: 'send_history.bouncedAt', label: 'Bounced At', type: 'date' },
    ],
  },
  {
    value: 'send_history.opened',
    label: 'Email Opened',
    fields: [
      { name: 'send_history.recipient', label: 'Recipient', type: 'string' },
      { name: 'send_history.templateId', label: 'Template ID', type: 'string' },
      { name: 'send_history.openedAt', label: 'Opened At', type: 'date' },
    ],
  },
  {
    value: 'send_history.clicked',
    label: 'Link Clicked',
    fields: [
      { name: 'send_history.recipient', label: 'Recipient', type: 'string' },
      { name: 'send_history.templateId', label: 'Template ID', type: 'string' },
      { name: 'send_history.url', label: 'Clicked URL', type: 'string' },
    ],
  },
] as const satisfies readonly EventTypeDescriptor[]

/** Union type of all valid event-type string values. */
export type EventType = (typeof EVENT_TYPES)[number]['value']

/** All valid event type values as a flat array (useful for Zod enums). */
export const EVENT_TYPE_VALUES: readonly EventType[] = EVENT_TYPES.map(
  (e) => e.value,
) as unknown as readonly EventType[]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the field descriptors for a given event type.
 * Returns an empty array for unknown event types.
 */
export function getFieldsForEventType(eventType: EventType): readonly EventField[] {
  const match = EVENT_TYPES.find((e) => e.value === eventType)
  return match?.fields ?? []
}

/** A group of event types that share the same prefix, for combobox display. */
export interface EventTypeGroup {
  readonly prefix: string
  readonly label: string
  readonly items: readonly EventTypeDescriptor[]
}

/** Prefix → human-friendly group label mapping. */
const GROUP_LABELS: Record<string, string> = {
  user: 'User Events',
  event: 'Event Events',
  send_history: 'Send History Events',
} as const

/**
 * EVENT_TYPES grouped by their dot-prefix (user.*, event.*, send_history.*).
 * Suitable for rendering grouped combobox / select UIs.
 */
export const EVENT_TYPES_GROUPED: readonly EventTypeGroup[] = (() => {
  const map = new Map<string, EventTypeDescriptor[]>()

  for (const et of EVENT_TYPES) {
    const prefix = et.value.split('.')[0]!
    if (!map.has(prefix)) {
      map.set(prefix, [])
    }
    map.get(prefix)!.push(et)
  }

  return Array.from(map.entries()).map(([prefix, items]) => ({
    prefix,
    label: GROUP_LABELS[prefix] ?? prefix,
    items,
  }))
})()
