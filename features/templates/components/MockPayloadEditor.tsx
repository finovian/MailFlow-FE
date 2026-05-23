'use client'

import * as React from 'react'
import { usePreviewStore } from '@/stores/previewStore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EVENT_TYPES, getFieldsForEventType, type EventType } from '@/constants/eventTypes'
import { AlertCircle, CheckCircle, Info, Lightbulb } from 'lucide-react'

interface MockPayloadEditorProps {
  variables: string[]
  eventType: EventType
  onEventTypeChange: (type: EventType) => void
}

export default function MockPayloadEditor({ 
  variables, 
  eventType,
  onEventTypeChange
}: MockPayloadEditorProps) {
  const { mockPayload, setMockPayload } = usePreviewStore()
  const [activeTab, setActiveTab] = React.useState<'fields' | 'json'>('fields')
  const [jsonText, setJsonText] = React.useState('')

  const availableFields = React.useMemo(() => 
    getFieldsForEventType(eventType).map(f => f.name),
    [eventType]
  )

  const usedVariables = variables.filter(v => availableFields.includes(v))
  const unknownVariables = variables.filter(v => !availableFields.includes(v))
  const unusedFields = availableFields.filter(f => !variables.includes(f))

  // Simple suggestion logic: if it's unknown but similar to available, suggest it
  const suggestedVariables = React.useMemo(() => {
    return unknownVariables.map(unk => {
      const bestMatch = availableFields.find(f => 
        f.includes(unk) || unk.includes(f) || f.split('.').pop() === unk.split('.').pop()
      )
      return bestMatch ? { unknown: unk, suggestion: bestMatch } : null
    }).filter(Boolean) as { unknown: string; suggestion: string }[]
  }, [unknownVariables, availableFields])

  // Initialize payload keys when variables change
  React.useEffect(() => {
    const updatedPayload = { ...mockPayload }
    let changed = false

    variables.forEach((variable) => {
      if (updatedPayload[variable] === undefined) {
        updatedPayload[variable] = ''
        changed = true
      }
    })

    // Clean up variables that are no longer in the list
    Object.keys(updatedPayload).forEach((key) => {
      if (!variables.includes(key)) {
        delete updatedPayload[key]
        changed = true
      }
    })

    if (changed || Object.keys(mockPayload).length === 0) {
      setMockPayload(updatedPayload)
      setJsonText(JSON.stringify(updatedPayload, null, 2))
    }
  }, [variables])

  // Keep jsonText in sync with store when using form inputs
  React.useEffect(() => {
    try {
      const parsed = JSON.parse(jsonText)
      if (JSON.stringify(parsed) !== JSON.stringify(mockPayload)) {
        setJsonText(JSON.stringify(mockPayload, null, 2))
      }
    } catch {
      setJsonText(JSON.stringify(mockPayload, null, 2))
    }
  }, [mockPayload])

  const handleFieldChange = (key: string, value: string) => {
    const nextPayload = { ...mockPayload, [key]: value }
    setMockPayload(nextPayload)
  }

  const handleJsonChange = (val: string) => {
    setJsonText(val)
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed === 'object' && parsed !== null) {
        setMockPayload(parsed)
      }
    } catch {
      // Allow invalid JSON while typing
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border/50 bg-card/25 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Variable Validation
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Event:</span>
          <Select
            value={eventType}
            onValueChange={(val) => onEventTypeChange(val as EventType)}
          >
            <SelectTrigger className="h-7 text-[10px] w-[140px] bg-background/50">
              <SelectValue placeholder="Select event..." />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((et) => (
                <SelectItem key={et.value} value={et.value} className="text-xs">
                  {et.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Used & Unknown */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">
              <CheckCircle className="size-3" /> Variables Used
            </div>
            {usedVariables.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {usedVariables.map(v => (
                  <span key={v} className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-mono text-green-600 dark:text-green-500 border border-green-500/20">
                    {v}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic pl-1">None detected</p>
            )}
          </div>

          {unknownVariables.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-destructive uppercase tracking-wider">
                <AlertCircle className="size-3" /> Unknown Variables
              </div>
              <div className="flex flex-wrap gap-1">
                {unknownVariables.map(v => (
                  <span key={v} className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-mono text-destructive border border-destructive/20">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Suggested & Unused */}
        <div className="space-y-3">
          {suggestedVariables.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                <Lightbulb className="size-3" /> Suggestions
              </div>
              <div className="space-y-1">
                {suggestedVariables.map(s => (
                  <div key={s.unknown} className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <span className="font-mono text-destructive/70 line-through">{s.unknown}</span>
                    <span>→</span>
                    <span className="font-mono text-amber-600 dark:text-amber-500 font-semibold">{s.suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <Info className="size-3" /> Unused Payload Fields
            </div>
            {unusedFields.length > 0 ? (
              <div className="flex flex-wrap gap-1 opacity-70">
                {unusedFields.map(f => (
                  <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border border-border/50">
                    {f}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic pl-1">All fields used</p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2">
        {variables.length > 0 && (
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'fields' | 'json')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="fields" className="text-xs">Forms</TabsTrigger>
              <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="mt-3 space-y-3">
              <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
                {variables.map((variable) => (
                  <div key={variable} className="space-y-1.5">
                    <Label
                      htmlFor={`var-${variable}`}
                      className="text-xs font-mono text-muted-foreground"
                    >
                      {variable}
                    </Label>
                    <Input
                      id={`var-${variable}`}
                      className="h-8 text-xs"
                      value={String(mockPayload[variable] ?? '')}
                      onChange={(e) => handleFieldChange(variable, e.target.value)}
                      placeholder={`Value for ${variable}...`}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="json" className="mt-3">
              <Textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder="{}"
                rows={8}
                className="font-mono text-xs focus-visible:ring-1"
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
