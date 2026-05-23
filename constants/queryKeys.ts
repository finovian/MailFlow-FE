/**
 * TanStack Query key constants for the Email Automation Platform.
 *
 * Using tuple keys enables granular cache invalidation:
 *   - invalidate(['templates'] )         → all template queries
 *   - invalidate(['templates', 'list'])  → only the list
 *   - invalidate(['templates', 'detail', id]) → single template
 */

export const QUERY_KEYS = {
  templates: {
    all: ['templates'] as const,
    list: (params?: any) => ['templates', 'list', params] as const,
    detail: (id: string) => ['templates', 'detail', id] as const,
  },
  triggers: {
    all: ['triggers'] as const,
    list: (params?: any) => ['triggers', 'list', params] as const,
    detail: (id: string) => ['triggers', 'detail', id] as const,
  },
  logs: {
    all: ['logs'] as const,
    list: (params?: any) => ['logs', 'list', params] as const,
  },
  events: {
    all: ['events'] as const,
    list: (params?: any) => ['events', 'list', params] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
    definitions: ['events', 'definitions'] as const,
  },
} as const
