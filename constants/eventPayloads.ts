import type { EventType } from './eventTypes'

export const EVENT_PAYLOAD_EXAMPLES: Record<EventType, Record<string, unknown>> = {
  'user.created': {
    user: {
      email: 'jay@finovian.com',
      name: 'Jay',
      createdAt: new Date().toISOString(),
    },
  },
  'user.updated': {
    user: {
      email: 'jay@finovian.com',
      name: 'Jay Kumar',
      plan: 'premium',
    },
  },
  'user.deleted': {
    user: {
      email: 'jay@finovian.com',
      name: 'Jay',
    },
  },
  'event.completed': {
    event: {
      name: 'Q3 Product Strategy Summit',
      date: new Date().toISOString(),
      attendees: 42,
    },
  },
  'event.cancelled': {
    event: {
      name: 'Weekly Standup',
      date: new Date().toISOString(),
      reason: 'Conflict with client presentation',
    },
  },
  'event.reminder': {
    event: {
      name: 'Developer Automation Demo',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntil: 2,
    },
  },
  'send_history.bounced': {
    send_history: {
      recipient: 'invalid-email-address@finovian.com',
      templateId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      bouncedAt: new Date().toISOString(),
    },
  },
  'send_history.opened': {
    send_history: {
      recipient: 'jay@finovian.com',
      templateId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      openedAt: new Date().toISOString(),
    },
  },
  'send_history.clicked': {
    send_history: {
      recipient: 'jay@finovian.com',
      templateId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      url: 'https://mailflow.io/welcome-guide',
    },
  },
}
