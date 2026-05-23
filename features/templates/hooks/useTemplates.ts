import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templatesService } from '@/services/templates.service'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { TemplateListParams, CreateTemplateDto, UpdateTemplateDto, TestSendDto } from '@/types/template'
import { toast } from 'sonner'

export function useTemplates(params: TemplateListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.templates.list(params),
    queryFn: () => templatesService.getAll(params),
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.templates.detail(id),
    queryFn: () => templatesService.getById(id),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTemplateDto) => templatesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.templates.all })
      toast.success('Template created')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create template')
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateDto }) =>
      templatesService.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.templates.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.templates.detail(id) })
      toast.success('Template updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update template')
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => templatesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.templates.all })
      toast.success('Template deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete template')
    },
  })
}

export function useTestSend() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TestSendDto }) =>
      templatesService.testSend(id, payload),
    onSuccess: () => {
      toast.success('Test email sent successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send test email')
    },
  })
}
