import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logsService } from '@/services/logs.service'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { LogListParams } from '@/types/log'
import { toast } from 'sonner'

export function useLogs(params: LogListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.logs.list(params),
    queryFn: () => logsService.getAll(params),
  })
}

export function useRetryLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => logsService.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.logs.all })
      toast.success('Log retry initiated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to retry')
    },
  })
}
