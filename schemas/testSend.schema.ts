
import { z } from 'zod'

export const testSendSchema = z.object({
  to: z.string().email('A valid email address is required'),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export type TestSendFormValues = z.infer<typeof testSendSchema>
