
import { z } from 'zod'

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be 200 characters or fewer'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  status: z.enum(['active', 'draft']).optional(),
})


export type CreateTemplateFormValues = z.infer<typeof createTemplateSchema>
export const updateTemplateSchema = createTemplateSchema.partial()
export type UpdateTemplateFormValues = z.infer<typeof updateTemplateSchema>
