import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { triggersService } from '@/services/triggers.service'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { CreateTriggerDto, UpdateTriggerDto } from '@/types/trigger'
import { toast } from 'sonner'

export function useTriggers() {
  return useQuery({
    queryKey: QUERY_KEYS.triggers.all,
    queryFn: () => triggersService.getAll(),
  })
}

export function useTrigger(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.triggers.detail(id),
    queryFn: () => triggersService.getById(id),
    enabled: !!id,
  })
}

export function useCreateTrigger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTriggerDto) => triggersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.triggers.all })
      toast.success('Trigger created')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create trigger')
    },
  })
}

export function useUpdateTrigger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTriggerDto }) =>
      triggersService.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.triggers.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.triggers.detail(id) })
      toast.success('Trigger updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update trigger')
    },
  })
}

export function useDeleteTrigger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => triggersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.triggers.all })
      toast.success('Trigger deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete trigger')
    },
  })
}
