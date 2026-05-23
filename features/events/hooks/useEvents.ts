import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsService, type FireEventPayload } from '@/services/events.service'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { toast } from 'sonner'

export function useEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.events.all,
    queryFn: () => eventsService.getAll(),
  })
}

export function useEventDetail(id: string, isPollingEnabled: boolean = false) {
  return useQuery({
    queryKey: QUERY_KEYS.events.detail(id),
    queryFn: () => eventsService.getById(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || !isPollingEnabled) return false
      // Poll every 2 seconds if status is PENDING or PROCESSING
      if (data.status === 'PENDING' || data.status === 'PROCESSING') {
        return 2000
      }
      return false
    },
  })
}

export function useFireEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FireEventPayload) => eventsService.fire(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.triggers.all })
      toast.success('Event triggered successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to trigger event')
    },
  })
}

import { setRuntimeDefinitions } from '@/lib/eventRegistry'

export function useEventDefinitions() {
  return useQuery({
    queryKey: QUERY_KEYS.events.definitions,
    queryFn: async () => {
      const defs = await eventsService.getDefinitions()
      setRuntimeDefinitions(defs)
      return defs
    },
    staleTime: Infinity, // load once
  })
}
