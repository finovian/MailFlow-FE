'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTriggerSchema, type CreateTriggerFormValues } from '@/schemas/trigger.schema'
import { useCreateTrigger, useUpdateTrigger } from '@/features/triggers/hooks/useTriggers'
import { useTemplates } from '@/features/templates/hooks/useTemplates'
import { useGenerateTrigger, useFixTemplateVariables, useSuggestConditions } from '@/features/triggers/hooks/useTriggerAi'
import { ConditionBuilder } from './ConditionBuilder'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  getEventTypeOptions,
  getEventFields,
  getEventDefinitionsGrouped,
  getEventPayloadFields,
  getEventMockPayload,
  getEventDefinition,
} from '@/lib/eventRegistry'
import {
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Mail,
  Zap,
  Filter,
  Clock,
  Eye,
  Code,
  CheckCircle2,
  Undo2,
  HeartCrack,
} from 'lucide-react'
import type { Trigger, ConditionGroup } from '@/types/trigger'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TriggerFormProps {
  initialData?: Trigger
}

export function TriggerForm({ initialData }: TriggerFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  // Active tab in Preview Simulator: 'diagram' | 'email' | 'mock'
  const [previewTab, setPreviewTab] = React.useState<'diagram' | 'email' | 'mock'>('diagram')

  // UI state to toggle collapsed sections
  const [conditionsExpanded, setConditionsExpanded] = React.useState(isEdit)
  const [advancedExpanded, setAdvancedExpanded] = React.useState(false)

  // Combobox popover states
  const [openEventSelect, setOpenEventSelect] = React.useState(false)
  const [openTemplateSelect, setOpenTemplateSelect] = React.useState(false)

  // AI generator prompt state
  const [aiPrompt, setAiPrompt] = React.useState('')
  const [showAiPrompt, setShowAiPrompt] = React.useState(false)

  // Fetch templates for dropdown selection
  const { data: templatesData, isLoading: loadingTemplates } = useTemplates({
    page: 1,
    pageSize: 100,
    status: 'active', // Only show active templates
  })

  // Mutations
  const { mutate: createTrigger, isPending: isCreating } = useCreateTrigger()
  const { mutate: updateTrigger, isPending: isUpdating } = useUpdateTrigger()
  const isSaving = isCreating || isUpdating

  // React Hook Form
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTriggerFormValues>({
    resolver: zodResolver(createTriggerSchema as any),
    defaultValues: {
      name: initialData?.name ?? '',
      eventType: (initialData?.eventType ?? '') as any,
      templateId: initialData?.templateId ?? '',
      recipientField: initialData?.recipientField ?? '',
      cooldownDays: initialData?.cooldownDays ?? 0,
      sendOnce: initialData?.sendOnce ?? false,
      status: initialData?.status ?? 'inactive',
      conditions: initialData?.conditions ?? {
        operator: 'AND',
        rules: [],
      },
    },
  })

  // Watched fields
  const eventType = watch('eventType')
  const templateId = watch('templateId')
  const recipientField = watch('recipientField')
  const cooldownDays = watch('cooldownDays')
  const sendOnce = watch('sendOnce')
  const status = watch('status')
  const triggerName = watch('name')
  const conditions = watch('conditions')

  // Templates
  const templates = templatesData?.data || []
  const selectedTemplate = React.useMemo(() => {
    return templates.find((t) => t.id === templateId)
  }, [templates, templateId])

  // Custom mock payload for live preview editing
  const [customMockPayload, setCustomMockPayload] = React.useState<Record<string, any>>({})

  // Update mock payload when event type changes
  React.useEffect(() => {
    if (eventType) {
      const defaults = getEventMockPayload(eventType)
      setCustomMockPayload(defaults)
    } else {
      setCustomMockPayload({})
    }
  }, [eventType])

  // State to hold fixed HTML Content if fixed by AI
  const [fixedHtmlContent, setFixedHtmlContent] = React.useState<string | null>(null)

  // Reset fixed HTML when template ID changes
  React.useEffect(() => {
    setFixedHtmlContent(null)
  }, [templateId])

  const templateHtml = fixedHtmlContent || selectedTemplate?.htmlContent || selectedTemplate?.bodyHtml || ''

  // AI helper hooks
  const { mutate: generateTriggerWithAi, isPending: isGeneratingAi } = useGenerateTrigger()
  const { mutate: fixVariablesWithAi, isPending: isFixingVariables } = useFixTemplateVariables()
  const { mutate: suggestConditionsWithAi, isPending: isSuggestingConditions } = useSuggestConditions()

  // Mapped templates options for display
  const eventDefinitionsGrouped = React.useMemo(() => getEventDefinitionsGrouped(), [])
  const eventOptions = React.useMemo(() => getEventTypeOptions(), [])
  const selectedEventDef = React.useMemo(() => {
    return getEventDefinition(eventType)
  }, [eventType])

  const eventFields = React.useMemo(() => {
    return getEventFields(eventType)
  }, [eventType])

  const availableVars = React.useMemo(() => {
    return getEventPayloadFields(eventType)
  }, [eventType])

  // Extract mustache placeholders from current template text
  const extractedTemplateVars = React.useMemo(() => {
    if (!templateHtml) return []
    const regex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g
    const matches = new Set<string>()
    let match
    while ((match = regex.exec(templateHtml)) !== null) {
      if (match[1]) {
        matches.add(match[1].trim())
      }
    }
    return Array.from(matches)
  }, [templateHtml])

  // Variables that the template requires but the event doesn't supply
  const extraVars = React.useMemo(() => {
    return extractedTemplateVars.filter((v) => !availableVars.includes(v))
  }, [extractedTemplateVars, availableVars])

  const isTemplateCompatible = extraVars.length === 0

  // Handles Event change
  const handleEventTypeChange = (newVal: any) => {
    setValue('eventType', newVal)
    setValue('conditions', {
      operator: 'AND',
      rules: [],
    })

    // Auto-detect email recipient field for DX
    const fields = getEventFields(newVal)
    const emailField = fields.find((f) => f.name.toLowerCase().includes('email'))?.name || ''
    if (emailField) {
      setValue('recipientField', emailField)
    } else if (fields.length > 0) {
      setValue('recipientField', fields[0]!.name)
    }

    // Set default trigger name if currently blank/empty
    if (!triggerName) {
      const label = eventOptions.find((e) => e.value === newVal)?.label || newVal
      setValue('name', `${label} Automation`)
    }

    toast.success(`Event type changed to "${newVal}". Defaults configured.`)
  }

  // AI trigger generation prompt execution
  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return

    toast.info('AI is interpreting your request and building the trigger...')
    generateTriggerWithAi(
      {
        prompt: aiPrompt,
        events: eventDefinitionsGrouped.flatMap((g) => g.items),
        templates,
      },
      {
        onSuccess: (data) => {
          if (data.name) setValue('name', data.name)
          if (data.eventType) handleEventTypeChange(data.eventType)
          if (data.templateId) setValue('templateId', data.templateId)
          if (data.recipientField) setValue('recipientField', data.recipientField)
          if (data.cooldownDays !== undefined) setValue('cooldownDays', data.cooldownDays)
          if (data.sendOnce !== undefined) setValue('sendOnce', data.sendOnce)
          if (data.conditions) setValue('conditions', data.conditions)

          toast.success('AI successfully configured the trigger values!')
          setShowAiPrompt(false)
          setAiPrompt('')
        },
        onError: (err: any) => {
          toast.error(err?.message || 'AI failed to configure the trigger. Please try manually.')
        },
      }
    )
  }

  // AI template variable alignment
  const handleFixTemplateVariables = () => {
    if (!templateHtml || extraVars.length === 0) return

    toast.info('AI is mapping template placeholders to event variables...')
    fixVariablesWithAi(
      {
        html: templateHtml,
        extraVariables: extraVars,
        availableVariables: availableVars,
      },
      {
        onSuccess: (data) => {
          setFixedHtmlContent(data.htmlContent)
          const maps = data.mappings.map((m) => `"${m.from}" → "${m.to}"`).join(', ')
          toast.success(`Mapped template variables: ${maps}`)
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to remap variables.')
        },
      }
    )
  }

  // AI Condition Suggestions
  const [suggestedConditions, setSuggestedConditions] = React.useState<Array<{ label: string; conditions: ConditionGroup }>>([])
  const handleSuggestConditions = () => {
    if (!eventType) return

    toast.info('AI is analyzing event properties to generate condition filters...')
    suggestConditionsWithAi(
      {
        eventType,
        fields: eventFields,
        description: selectedEventDef?.description,
      },
      {
        onSuccess: (data: any) => {
          setSuggestedConditions(data.suggestions || [])
          toast.success('Generated 3 condition suggestions!')
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to suggest conditions.')
        },
      }
    )
  }

  const applySuggestedConditions = (condGroup: ConditionGroup) => {
    setValue('conditions', condGroup)
    toast.success('Applied condition rules!')
    setSuggestedConditions([])
  }

  // Flatten mock payload for dynamic template preview rendering
  const renderedHtml = React.useMemo(() => {
    if (!templateHtml) return ''
    let rendered = templateHtml

    const flattenObj = (obj: any, prefix = ''): Record<string, any> => {
      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flattenObj(value, path))
        } else {
          result[path] = value
        }
      }
      return result
    }

    const flatMock = flattenObj(customMockPayload)

    Object.entries(flatMock).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      rendered = rendered.replace(regex, String(value ?? ''))
    })

    // Highlight missing placeholders nicely
    rendered = rendered.replace(
      /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g,
      '<span style="background-color: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px dashed #ef4444; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; font-family: monospace;">{{$1}}</span>'
    )

    const hasHtmlStructure = /<html[^>]*>|<body[^>]*>/i.test(rendered)
    if (hasHtmlStructure) {
      return rendered
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #0f172a;
              background-color: #ffffff;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          ${rendered}
        </body>
      </html>
    `
  }, [templateHtml, customMockPayload])

  // Submit Handler
  const onSubmit = (values: any) => {
    if (!values.eventType) {
      toast.error('Please select an event type.')
      return
    }
    if (!values.templateId) {
      toast.error('Please select a template.')
      return
    }

    if (isEdit && initialData) {
      updateTrigger(
        { id: initialData.id, data: values },
        {
          onSuccess: () => router.push('/triggers'),
        }
      )
    } else {
      createTrigger(values, {
        onSuccess: () => router.push('/triggers'),
      })
    }
  }

  // Parse condition tree to plain English statements
  const flatRulesList = React.useMemo(() => {
    const list: string[] = []
    const walk = (group: ConditionGroup) => {
      if (!group || !group.rules) return
      group.rules.forEach((rule) => {
        if ('operator' in rule) {
          walk(rule as ConditionGroup)
        } else {
          list.push(`${rule.field} ${rule.op} "${rule.value}"`)
        }
      })
    }
    walk(conditions)
    return list
  }, [conditions])

  // Progressive creation flags
  const showStep2 = !!eventType || isEdit
  const showStep3AndBeyond = (!!eventType && !!templateId) || isEdit

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/triggers')}
            className="rounded-full hover:bg-muted/80"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {isEdit ? `Edit Trigger: ${initialData.name}` : 'Create Automation Trigger'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose when emails should be sent automatically based on system events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              className={cn(
                "h-9 text-xs gap-1.5 font-medium transition-all",
                showAiPrompt ? "bg-primary/5 text-primary border-primary/20" : ""
              )}
            >
              <Sparkles className="size-4 text-amber-500 animate-pulse" />
              Build with AI
            </Button>
          )}

          {showStep3AndBeyond && (
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="gap-1.5 text-xs h-9 font-medium px-4 shadow-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 border-0"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Trigger
            </Button>
          )}
        </div>
      </div>

      {/* AI Prompt Input Bar (Collapsible) */}
      {showAiPrompt && (
        <Card className="bg-gradient-to-br from-indigo-50/40 to-violet-50/40 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200/50 dark:border-indigo-950/40 p-5 rounded-xl shadow-xs transition-all duration-300">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400" />
              <Label className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                Describe the automation trigger in plain English
              </Label>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Send the onboarding template to new users who sign up with a gmail address"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                disabled={isGeneratingAi}
                className="bg-card border-border/80 text-xs shadow-none"
              />
              <Button
                onClick={handleAiGenerate}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                className="gap-1.5 text-xs h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                {isGeneratingAi ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Generate
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              AI will automatically select the event type, recommended template, map variables, and create conditional filters.
            </p>
          </div>
        </Card>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Steps (8/12 width) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Event Selector */}
          <Card className="bg-card/40 border-border/50 shadow-xs backdrop-blur-xs transition-all duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                  1
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">When should this run?</CardTitle>
                  <CardDescription className="text-[11px]">
                    Select the system event that triggers this automation.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Popover open={openEventSelect} onOpenChange={setOpenEventSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEventSelect}
                      className="w-full justify-between h-10 text-xs font-medium bg-card/60 shadow-none border-border/80"
                    >
                      {eventType ? (
                        <div className="flex items-center gap-2">
                          <Zap className="size-3.5 text-amber-500 fill-amber-500/10" />
                          <span className="font-semibold text-foreground">
                            {eventOptions.find((e) => e.value === eventType)?.label || eventType}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">({eventType})</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Search and select event type...</span>
                      )}
                      <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search event type..." className="h-8" />
                      <CommandList>
                        <CommandEmpty>No event type found.</CommandEmpty>
                        {eventDefinitionsGrouped.map((group) => (
                          <CommandGroup key={group.category} heading={group.categoryLabel}>
                            {group.items.map((item) => (
                              <CommandItem
                                key={item.type}
                                value={item.type}
                                onSelect={() => {
                                  handleEventTypeChange(item.type)
                                  setOpenEventSelect(false)
                                }}
                                className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span className="font-semibold text-xs text-foreground">{item.label}</span>
                                  <span className="font-mono text-[10px] text-muted-foreground">{item.type}</span>
                                </div>
                                {item.description && (
                                  <span className="text-[10px] text-muted-foreground font-normal line-clamp-1">
                                    {item.description}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {eventType && (
                <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2 animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-1.5">
                    <Info className="size-3.5 text-indigo-500" />
                    <span className="text-[11px] font-semibold text-foreground">Available Event Parameters:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {eventFields.map((f) => (
                      <Badge
                        key={f.name}
                        variant="secondary"
                        className="font-mono text-[9px] px-2 py-0.5 bg-card border border-border/40 text-muted-foreground font-normal"
                      >
                        {f.name} <span className="opacity-60 text-[8px]">({f.type})</span>
                      </Badge>
                    ))}
                  </div>
                  {selectedEventDef?.description && (
                    <p className="text-[10px] text-muted-foreground italic pt-1">{selectedEventDef.description}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Template Selector */}
          {showStep2 && (
            <Card className="bg-card/40 border-border/50 shadow-xs backdrop-blur-xs transition-all duration-200 animate-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                    2
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">What email should be sent?</CardTitle>
                    <CardDescription className="text-[11px]">
                      Choose the active email template to bind to this event.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Popover open={openTemplateSelect} onOpenChange={setOpenTemplateSelect}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openTemplateSelect}
                        className="w-full justify-between h-10 text-xs font-medium bg-card/60 shadow-none border-border/80"
                        disabled={loadingTemplates}
                      >
                        {templateId ? (
                          <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-indigo-500 fill-indigo-500/10" />
                            <span className="font-semibold text-foreground">
                              {templates.find((t) => t.id === templateId)?.name || templateId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {loadingTemplates ? 'Loading templates...' : 'Search and select template...'}
                          </span>
                        )}
                        <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search templates..." className="h-8" />
                        <CommandList>
                          <CommandEmpty>No template found.</CommandEmpty>
                          <CommandGroup heading="Active Templates">
                            {templates.map((tmpl) => (
                              <CommandItem
                                key={tmpl.id}
                                value={tmpl.name}
                                onSelect={() => {
                                  setValue('templateId', tmpl.id)
                                  setOpenTemplateSelect(false)
                                }}
                                className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                              >
                                <span className="font-semibold text-xs text-foreground">{tmpl.name}</span>
                                <span className="text-[10px] text-muted-foreground font-normal line-clamp-1">
                                  Subject: {tmpl.subject}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.templateId && (
                    <p className="text-[10px] font-medium text-destructive">{errors.templateId.message}</p>
                  )}
                </div>

                {/* Compatibility and template preview details */}
                {selectedTemplate && (
                  <div className="space-y-3 animate-in fade-in-50 duration-200">
                    {/* Template quick info card */}
                    <div className="p-3 bg-muted/20 border border-border/40 rounded-lg flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-foreground">{selectedTemplate.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Subject: <span className="text-foreground/80">"{selectedTemplate.subject}"</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0">
                        {selectedTemplate.status}
                      </Badge>
                    </div>

                    {/* Compatibility validator */}
                    {!isTemplateCompatible ? (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in shake duration-300">
                        <div className="flex gap-2">
                          <AlertTriangle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                              Placeholder variables mismatch
                            </div>
                            <div className="text-[10px] text-rose-600 dark:text-rose-300 leading-normal">
                              Template requires:{' '}
                              <code className="bg-rose-500/10 px-1 py-0.5 rounded font-mono text-[9px]">
                                {extraVars.join(', ')}
                              </code>{' '}
                              which are not in the event payload.
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleFixTemplateVariables}
                          disabled={isFixingVariables}
                          className="h-8 border-rose-300/40 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300 text-[10px] gap-1 font-semibold"
                        >
                          {isFixingVariables ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Sparkles className="size-3 text-amber-500 fill-amber-500/10" />
                          )}
                          Fix with AI
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <Check className="size-4 shrink-0" />
                        <span className="text-[11px] font-semibold">
                          All template variables are compatible with the selected event.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Steps 3, 4, 5 */}
          {showStep3AndBeyond && (
            <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-300">
              {/* Step 3: Recipient Rule */}
              <Card className="bg-card/40 border-border/50 shadow-xs backdrop-blur-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                      3
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Who receives this?</CardTitle>
                      <CardDescription className="text-[11px]">
                        Specify the email address field from the event payload.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Input
                      id="recipientField"
                      placeholder="e.g. user.email"
                      {...register('recipientField')}
                      className="bg-card/60 text-xs"
                      disabled={isSaving}
                    />
                    {errors.recipientField && (
                      <p className="text-[10px] font-medium text-destructive">{errors.recipientField.message}</p>
                    )}
                  </div>

                  {/* Suggestions list */}
                  {eventFields.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground font-medium block">
                        Quick Suggestions from Event schema:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {eventFields
                          .filter((f) => f.name.toLowerCase().includes('email') || f.name.toLowerCase().includes('recipient'))
                          .map((f) => (
                            <button
                              key={f.name}
                              type="button"
                              onClick={() => setValue('recipientField', f.name)}
                              className={cn(
                                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] border transition-all cursor-pointer",
                                recipientField === f.name
                                  ? 'bg-indigo-500/10 text-indigo-600 border-indigo-400/40 dark:text-indigo-400'
                                  : 'bg-card border-border hover:bg-muted/40 text-muted-foreground'
                              )}
                            >
                              <Mail className="size-3" />
                              {f.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 4: Optional Conditions (Collapsed by default) */}
              <Card className="bg-card/40 border-border/50 shadow-xs backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setConditionsExpanded(!conditionsExpanded)}
                  className="w-full flex items-center justify-between p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-left">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                      4
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        Optional Conditions
                        {flatRulesList.length > 0 && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[9px] bg-indigo-500/10 text-indigo-600 border-indigo-200/20">
                            {flatRulesList.length} rules
                          </Badge>
                        )}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Define conditional logic rules before automated execution occurs.
                      </p>
                    </div>
                  </div>
                  {conditionsExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                </button>

                {conditionsExpanded && (
                  <CardContent className="border-t border-border/30 pt-4 space-y-4 animate-in fade-in-50 duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-950/20 rounded-lg p-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-300">
                          AI Rule Suggestions
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Generate conditional logic recommended for the "{eventType}" event.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={handleSuggestConditions}
                        disabled={isSuggestingConditions}
                        className="h-8 text-[10px] border-indigo-200/40 text-indigo-600 dark:text-indigo-400 gap-1 bg-card hover:bg-indigo-500/10 font-semibold"
                      >
                        {isSuggestingConditions ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Sparkles className="size-3 text-amber-500" />
                        )}
                        Suggest Conditions
                      </Button>
                    </div>

                    {/* AI Suggestions Display */}
                    {suggestedConditions.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-2">
                        {suggestedConditions.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applySuggestedConditions(s.conditions)}
                            className="text-left p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-950/40 bg-card hover:bg-indigo-500/5 transition-all text-xs flex flex-col gap-1 shadow-xs cursor-pointer group"
                          >
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Sparkles className="size-3 shrink-0" />
                              {s.label}
                            </span>
                            <span className="text-[9px] text-muted-foreground line-clamp-2">
                              Click to apply condition structure
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <Controller
                      name="conditions"
                      control={control}
                      render={({ field }) => (
                        <ConditionBuilder
                          value={field.value}
                          onChange={field.onChange}
                          eventType={eventType}
                        />
                      )}
                    />
                  </CardContent>
                )}
              </Card>

              {/* Step 5: Advanced Delivery Rules (Collapsed by default) */}
              <Card className="bg-card/40 border-border/50 shadow-xs backdrop-blur-xs">
                <button
                  type="button"
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  className="w-full flex items-center justify-between p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-left">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                      5
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Advanced Rules</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Configure status, deduplication triggers, and execution cooldowns.
                      </p>
                    </div>
                  </div>
                  {advancedExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                </button>

                {advancedExpanded && (
                  <CardContent className="border-t border-border/30 pt-4 space-y-4 animate-in fade-in-50 duration-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="cooldownDays" className="text-xs font-medium">
                        Cooldown Period (Days)
                      </Label>
                      <Input
                        id="cooldownDays"
                        type="number"
                        placeholder="0"
                        {...register('cooldownDays', { valueAsNumber: true })}
                        disabled={isSaving}
                        className="bg-card/60 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Wait period (days) required before triggers will evaluate for the same recipient again.
                      </p>
                      {errors.cooldownDays && (
                        <p className="text-[10px] font-medium text-destructive">{errors.cooldownDays.message}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-medium">Send Once Only</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Fire this trigger only once per recipient.
                        </p>
                      </div>
                      <Controller
                        name="sendOnce"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-medium">Active State</Label>
                        <p className="text-[10px] text-muted-foreground">
                          Enable or disable automated trigger evaluation.
                        </p>
                      </div>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value === 'active'}
                            onCheckedChange={(checked) =>
                              field.onChange(checked ? 'active' : 'inactive')
                            }
                            disabled={isSaving}
                          />
                        )}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Trigger Name Field */}
              <Card className="bg-card/40 border-border/50 shadow-xs backdrop-blur-xs">
                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold">
                      Trigger Rule Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Welcome Email Flow"
                      {...register('name')}
                      className="bg-card/60 text-xs font-medium h-9"
                      disabled={isSaving}
                    />
                    {errors.name && (
                      <p className="text-[10px] font-medium text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column: Live Automation Preview Simulator (4/12 width) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <Card className="border-border bg-card shadow-md rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/40 pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Eye className="size-4 text-indigo-500" />
                    Automation Preview
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Real-time simulation of trigger rule behavior.
                  </CardDescription>
                </div>
                <div className="flex items-center rounded-lg border border-border/40 p-0.5 bg-background">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('diagram')}
                    className={cn(
                      'px-2 py-1 text-[10px] font-medium rounded transition-all cursor-pointer',
                      previewTab === 'diagram' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Flow
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('email')}
                    className={cn(
                      'px-2 py-1 text-[10px] font-medium rounded transition-all cursor-pointer',
                      previewTab === 'email' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('mock')}
                    className={cn(
                      'px-2 py-1 text-[10px] font-medium rounded transition-all cursor-pointer',
                      previewTab === 'mock' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    JSON
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 min-h-[420px] flex flex-col justify-between">
              {/* Tab Content: Diagram */}
              {previewTab === 'diagram' && (
                <div className="space-y-5 py-2 flex-1 flex flex-col justify-center">
                  <div className="space-y-4">
                    {/* Trigger Card */}
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl relative group">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                          <Zap className="size-4 fill-amber-500/10" />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            Trigger Event
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {eventType ? `When ${eventOptions.find((e) => e.value === eventType)?.label || eventType} occurs` : 'Select an event type...'}
                          </span>
                          {eventType && (
                            <span className="text-[9px] text-muted-foreground font-mono block mt-0.5">
                              payload: {`{ user, event, send_history }`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Arrow Spacer */}
                    <div className="flex justify-center my-1.5">
                      <div className="w-px h-6 border-l border-dashed border-border" />
                    </div>

                    {/* Filter Card */}
                    <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                          <Filter className="size-4" />
                        </div>
                        <div className="space-y-1 text-left flex-1">
                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                            Conditional Filters
                          </span>
                          {flatRulesList.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">
                              Always Fired (no conditional rules applied)
                            </span>
                          ) : (
                            <div className="space-y-1 pt-0.5">
                              <span className="text-[10px] font-semibold text-foreground block">
                                Matches {conditions.operator || 'AND'} of:
                              </span>
                              <div className="space-y-1">
                                {flatRulesList.map((r, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono bg-card border border-border/30 px-2 py-0.5 rounded"
                                  >
                                    <CheckCircle2 className="size-3 text-violet-500 shrink-0" />
                                    <span>{r}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Arrow Spacer */}
                    <div className="flex justify-center my-1.5">
                      <div className="w-px h-6 border-l border-dashed border-border" />
                    </div>

                    {/* Action Card */}
                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                          <Mail className="size-4 fill-indigo-500/10" />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                            Automated Email Action
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {templateId ? `Send template: ${templates.find((t) => t.id === templateId)?.name || templateId}` : 'Select an email template...'}
                          </span>
                          {recipientField && (
                            <span className="text-[9px] text-muted-foreground block mt-0.5 font-mono">
                              To address: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{recipientField}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Live Rendered Email Preview */}
              {previewTab === 'email' && (
                <div className="flex-1 flex flex-col gap-3 py-2">
                  {!templateId ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-16 flex-1">
                      <Mail className="size-8 stroke-1" />
                      <span className="text-xs">Select a template to render email mockup.</span>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-[360px] border border-border/40 rounded-xl overflow-hidden bg-white shadow-inner flex flex-col">
                      <div className="flex items-center gap-1.5 border-b border-border/50 bg-muted/40 px-3 py-1.5">
                        <div className="size-2 rounded-full bg-red-400" />
                        <div className="size-2 rounded-full bg-yellow-400" />
                        <div className="size-2 rounded-full bg-green-400" />
                        <div className="mx-auto text-[9px] font-semibold text-muted-foreground font-mono">
                          Live Render Sandbox
                        </div>
                      </div>
                      <iframe
                        srcDoc={renderedHtml}
                        title="Live email trigger render"
                        className="w-full flex-1 border-0 bg-white"
                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Mock JSON Payload */}
              {previewTab === 'mock' && (
                <div className="flex-1 flex flex-col gap-2 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Simulation Event Payload (JSON)
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold">
                      Edit to see template content change
                    </span>
                  </div>
                  <textarea
                    value={JSON.stringify(customMockPayload, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        setCustomMockPayload(parsed)
                      } catch (err) {
                        // Suppress invalid JSON formatting exceptions during user typings
                      }
                    }}
                    className="w-full h-80 font-mono text-[10px] p-3 bg-zinc-950 text-green-400 rounded-xl border border-border focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Delivery Rules Status Indicator Footer */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                  <Clock className="size-3" />
                  <span>Cooldown: {cooldownDays > 0 ? `${cooldownDays}d` : 'None'}</span>
                </div>
                <div>
                  <span>Deduplicate: {sendOnce ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn('size-1.5 rounded-full', status === 'active' ? 'bg-green-500' : 'bg-zinc-400')} />
                  <span className="capitalize">{status}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
