'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { testSendSchema, type TestSendFormValues } from '@/schemas/testSend.schema'
import { useTestSend } from '@/features/templates/hooks/useTemplates'
import { usePreviewStore } from '@/stores/previewStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface TestSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName: string
  variables: string[]
}

export function TestSendDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
  variables,
}: TestSendDialogProps) {
  const { mutate: testSend, isPending } = useTestSend()
  const { mockPayload } = usePreviewStore()
  
  const [payloadText, setPayloadText] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setPayloadText(JSON.stringify(mockPayload, null, 2))
    }
  }, [mockPayload, open])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TestSendFormValues>({
    resolver: zodResolver(testSendSchema),
    defaultValues: {
      to: '',
      payload: {},
    },
  })

  const onSubmit = (values: TestSendFormValues) => {
    let parsedPayload: Record<string, unknown> = {}
    try {
      if (payloadText.trim()) {
        parsedPayload = JSON.parse(payloadText)
      }
    } catch {
      // If parsing fails, fall back to current mockPayload from store
      parsedPayload = mockPayload
    }

    testSend(
      {
        id: templateId,
        payload: {
          recipientEmail: values.to,
          mockPayload: parsedPayload,
        },
      },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Test your template "{templateName}" by sending an email with mock variables.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="to">Recipient Email</Label>
            <Input
              id="to"
              placeholder="you@example.com"
              {...register('to')}
              disabled={isPending}
            />
            {errors.to && (
              <p className="text-xs font-medium text-destructive">{errors.to.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payload">Template Payload (JSON)</Label>
            <Textarea
              id="payload"
              rows={6}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              placeholder="{}"
              className="font-mono text-xs"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Provide values for your template variables: {variables.length > 0 ? variables.map(v => `{{${v}}}`).join(', ') : 'No variables detected'}
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              Send Test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
