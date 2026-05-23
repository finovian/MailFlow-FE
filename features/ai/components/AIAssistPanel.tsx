'use client'

import * as React from 'react'
import { Sparkles, Loader2, Copy, Check, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useSubjectVariants,
  useToneRewrite,
  usePlaceholderValidate,
} from '@/features/ai/hooks/useAI'
import { EVENT_TYPES, type EventType } from '@/constants/eventTypes'

interface AIAssistPanelProps {
  currentSubject: string
  currentHtml: string
  onApplySubject: (subject: string) => void
  onApplyHtml: (html: string) => void
}

export function AIAssistPanel({
  currentSubject,
  currentHtml,
  onApplySubject,
  onApplyHtml,
}: AIAssistPanelProps) {
  const [activeTab, setActiveTab] = React.useState<'subject' | 'tone' | 'validate'>('subject')


  const { mutate: getVariants, isPending: loadingVariants, data: variants } = useSubjectVariants()
  const handleGenerateVariants = () => {
    if (!currentSubject.trim()) return
    getVariants({ subject: currentSubject })
  }


  const [targetTone, setTargetTone] = React.useState('professional')
  const [toneText, setToneText] = React.useState('')
  const { mutate: rewriteTone, isPending: loadingTone, data: rewrittenResult } = useToneRewrite()

  React.useEffect(() => {
    const plainText = currentHtml.replace(/<[^>]*>/g, '').trim()
    setToneText(plainText.slice(0, 500))
  }, [currentHtml])

  const handleRewriteTone = () => {
    if (!toneText.trim()) return
    rewriteTone({ text: toneText, tone: targetTone })
  }

  const [eventType, setEventType] = React.useState<EventType>('user.created')
  const {
    mutate: validatePlaceholders,
    isPending: loadingValidation,
    data: validationResult,
  } = usePlaceholderValidate()

  const handleValidate = () => {
    validatePlaceholders({ html: currentHtml, eventType })
  }

  // Copy helpers
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="size-4 text-primary animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Co-Pilot</h3>
          <p className="text-[10px] text-muted-foreground">Boost email response & copy</p>
        </div>
      </div>


<div className="flex items-center gap-2 mb-3">
  <Label className="text-xs text-muted-foreground">Trigger Event Type</Label>
  <Select value={eventType} onValueChange={(val) => setEventType(val as EventType)}>
    <SelectTrigger className="h-8 text-xs w-[180px]" size="sm">
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
<Tabs
  value={activeTab}
  onValueChange={(val) => setActiveTab(val as any)}
  className="flex flex-1 flex-col mt-4"
>      
        <TabsList className="grid w-full grid-cols-3 h-8">
          <TabsTrigger value="subject" className="text-xs">Subject</TabsTrigger>
          <TabsTrigger value="tone" className="text-xs">Tone</TabsTrigger>
          <TabsTrigger value="validate" className="text-xs">Validate</TabsTrigger>
        </TabsList>

        {/* Subject variants generator */}
        <TabsContent value="subject" className="flex flex-1 flex-col gap-3 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Base Subject Line</Label>
            <Textarea
              value={currentSubject}
              disabled
              rows={2}
              className="resize-none bg-muted/30 text-xs"
              placeholder="Type a subject line in the main editor first..."
            />
          </div>

          <Button
            onClick={handleGenerateVariants}
            disabled={loadingVariants || !currentSubject.trim()}
            size="sm"
            className="w-full gap-1.5"
          >
            {loadingVariants ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Generate Variants
          </Button>

          {variants && variants.length > 0 && (
            <div className="space-y-2 mt-2 flex-1 overflow-y-auto max-h-[320px] pr-1">
              <p className="text-[10px] font-medium text-muted-foreground">AI Recommendations</p>
              {variants.map((v: any, i: number) => (
                <div
                  key={i}
                  className="group relative rounded-lg border border-border/40 bg-muted/20 p-2.5 transition-all hover:bg-muted/40"
                >
                  <p className="text-xs font-semibold text-foreground pr-8">{v.subject}</p>
                  <span className="mt-1 inline-block rounded bg-primary/10 px-1 py-0.5 text-[9px] uppercase tracking-wider text-primary font-medium">
                    {v.tone}
                  </span>
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(v.subject, i)}
                    >
                      {copiedIndex === i ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      className="h-6 text-[10px]"
                      onClick={() => onApplySubject(v.subject)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tone Rewriter */}
        <TabsContent value="tone" className="flex flex-1 flex-col gap-3 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Target Tone</Label>
            <Select value={targetTone} onValueChange={setTargetTone}>
              <SelectTrigger className="h-8 text-xs" size="sm">
                <SelectValue placeholder="Select tone..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="excited">Excited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Text to Rewrite</Label>
            <Textarea
              value={toneText}
              onChange={(e) => setToneText(e.target.value)}
              rows={4}
              maxLength={500}
              className="text-xs resize-none"
              placeholder="Provide a text draft or copy from visual editor..."
            />
            <div className="text-right text-[10px] text-muted-foreground">
              {toneText.length}/500 chars
            </div>
          </div>

          <Button
            onClick={handleRewriteTone}
            disabled={loadingTone || !toneText.trim()}
            size="sm"
            className="w-full gap-1.5"
          >
            {loadingTone ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Rewrite Text
          </Button>

          {rewrittenResult && (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-2.5 mt-2">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Rewritten Draft</p>
              <div className="text-xs text-foreground bg-card/45 p-2 rounded border border-border/20 font-sans max-h-[140px] overflow-y-auto whitespace-pre-wrap">
                {rewrittenResult.rewritten}
              </div>
              <div className="flex justify-end gap-1.5 mt-2">
                <Button
                  variant="ghost"
                  size="xs"
                  className="gap-1 text-[10px]"
                  onClick={() => handleCopy(rewrittenResult.rewritten, 99)}
                >
                  {copiedIndex === 99 ? (
                    <Check className="size-3 text-green-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  Copy
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  className="text-[10px]"
                  onClick={() => onApplyHtml(rewrittenResult.rewritten.replace(/\n/g, '<br />'))}
                >
                  Insert HTML
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Placeholders Validator */}
        <TabsContent value="validate" className="flex flex-1 flex-col gap-3 mt-3">
          {/* Event type selector moved above tabs; validation uses selected eventType */}

          <Button
            onClick={handleValidate}
            disabled={loadingValidation || !currentHtml.trim()}
            size="sm"
            className="w-full gap-1.5"
          >
            {loadingValidation ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle className="size-3.5" />
            )}
            Validate Variables
          </Button>

          {validationResult && (
            <div className="space-y-3 mt-2 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {/* Valid fields */}
              {validationResult.valid && validationResult.valid.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-500">
                    <CheckCircle className="size-3" /> Valid Variables
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {validationResult.valid.map((v: string) => (
                      <span
                        key={v}
                        className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-mono text-green-600 dark:text-green-500"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing fields */}
              {validationResult.missing && validationResult.missing.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-500">
                    <AlertCircle className="size-3" /> Event Fields Not Used
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {validationResult.missing.map((v: string) => (
                      <span
                        key={v}
                        className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-500"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra fields */}
              {validationResult.extra && validationResult.extra.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-destructive">
                    <AlertCircle className="size-3" /> Unknown Variables (Will Fail)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {validationResult.extra.map((v: string) => (
                      <span
                        key={v}
                        className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-mono text-destructive"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {validationResult.valid?.length === 0 &&
                validationResult.extra?.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No template placeholders are using event payload variables.
                  </p>
                )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
