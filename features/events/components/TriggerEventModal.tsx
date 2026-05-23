'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PayloadEditor } from './PayloadEditor'
import { EventProcessingPanel } from './EventProcessingPanel'
import { useFireEvent } from '@/features/events/hooks/useEvents'
import { EVENT_TYPES_GROUPED } from '@/constants/eventTypes'
import { EVENT_PAYLOAD_EXAMPLES } from '@/constants/eventPayloads'
import { Loader2, Radio, Send, RefreshCw, KeyRound, Sparkles } from 'lucide-react'

interface TriggerEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TriggerEventModal({ open, onOpenChange }: TriggerEventModalProps) {
  const [selectedEventType, setSelectedEventType] = React.useState<string>('user.created')
  const [payloadString, setPayloadString] = React.useState<string>('')
  const [idempotencyKey, setIdempotencyKey] = React.useState<string>('')
  const [jsonError, setJsonError] = React.useState<string | null>(null)
  const [firedEventId, setFiredEventId] = React.useState<string | null>(null)

  const { mutateAsync: fireEvent, isPending: firing } = useFireEvent()

  // Generate a new idempotency key when modal opens
  React.useEffect(() => {
    if (open) {
      setIdempotencyKey(crypto.randomUUID())
      setFiredEventId(null)
      // Set default example payload for initial type
      const defaultExample = EVENT_PAYLOAD_EXAMPLES['user.created']
      setPayloadString(JSON.stringify(defaultExample, null, 2))
      setJsonError(null)
    }
  }, [open])

  // Update example payload when event type changes
  const handleEventTypeChange = (type: string) => {
    setSelectedEventType(type)
    const example = EVENT_PAYLOAD_EXAMPLES[type as keyof typeof EVENT_PAYLOAD_EXAMPLES]
    if (example) {
      setPayloadString(JSON.stringify(example, null, 2))
      setJsonError(null)
    }
  }

  const handlePayloadChange = (val: string) => {
    setPayloadString(val)
    if (jsonError) {
      try {
        JSON.parse(val)
        setJsonError(null)
      } catch (e) {
        // Keep error until fixed
      }
    }
  }

  const handleRegenIdempotency = () => {
    setIdempotencyKey(crypto.randomUUID())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Validate JSON
    let parsedPayload: Record<string, any> = {}
    try {
      parsedPayload = JSON.parse(payloadString)
      setJsonError(null)
    } catch (err: any) {
      setJsonError(`Invalid JSON format: ${err.message}`)
      return
    }

    // 2. Fire Event
    try {
      const res = await fireEvent({
        eventType: selectedEventType,
        idempotencyKey,
        payload: parsedPayload,
      })
      if (res?.success && res?.data?.id) {
        setFiredEventId(res.data.id)
      }
    } catch (err) {
      // Handled in hooks
    }
  }

  const isFormView = !firedEventId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`bg-card/95 border border-border/40 backdrop-blur-2xl duration-300 text-foreground transition-all ${
          isFormView ? 'sm:max-w-md' : 'sm:max-w-6xl max-h-[90vh] overflow-y-auto'
        }`}
        showCloseButton={isFormView}
      >
        {isFormView ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/15">
                  <Radio className="size-4 animate-pulse" />
                </div>
                <span>Event Trigger Simulation</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Manually dispatch a mock event into Inngest to simulate the execution of conditional automation triggers and delivery pipelines in real time.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Select Event Type
                </label>
                <Select value={selectedEventType} onValueChange={handleEventTypeChange}>
                  <SelectTrigger className="w-full h-10 border-border/40 bg-card/50 text-foreground text-xs shadow-xs [&>span]:w-full">
                    <SelectValue placeholder="Choose an event type..." />
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card/95 backdrop-blur-lg">
                    {EVENT_TYPES_GROUPED.map((group) => (
                      <SelectGroup key={group.prefix}>
                        <SelectLabel className="text-[10px] font-bold text-primary/75 uppercase tracking-widest px-2 py-1.5 border-b border-border/10 bg-muted/10">
                          {group.label}
                        </SelectLabel>
                        {group.items.map((item) => (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                            className="text-xs focus:bg-primary/10 py-2 cursor-pointer"
                          >
                            {item.label}
                            <span className="text-[9.5px] text-muted-foreground/60 font-mono ml-2">
                              ({item.value})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Idempotency Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Idempotency Key
                  <span className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                    System Autogen
                  </span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-muted-foreground/60">
                    <KeyRound className="size-3.5" />
                  </div>
                  <input
                    type="text"
                    value={idempotencyKey}
                    readOnly
                    className="w-full h-10 pl-9 pr-12 text-xs font-mono bg-muted/30 border border-border/40 rounded-lg outline-hidden text-muted-foreground select-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleRegenIdempotency}
                    className="absolute right-1 text-muted-foreground hover:text-foreground h-8 w-8 hover:bg-muted/40"
                    title="Regenerate token"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Monaco Payload Editor */}
              <PayloadEditor
                value={payloadString}
                onChange={handlePayloadChange}
                disabled={firing}
                error={jsonError}
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={firing}
                  className="border-border/40 text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={firing}
                  className="text-xs font-semibold shadow-xs h-9 px-4 min-w-[120px] gap-1.5"
                >
                  {firing ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Trigger Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-2">
            <EventProcessingPanel
              eventId={firedEventId}
              onBack={() => {
                setFiredEventId(null)
                setIdempotencyKey(crypto.randomUUID())
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
export default TriggerEventModal
