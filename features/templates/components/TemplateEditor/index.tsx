'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createTemplateSchema,
  type CreateTemplateFormValues,
} from '@/schemas/template.schema'
import {
  useCreateTemplate,
  useUpdateTemplate,
} from '@/features/templates/hooks/useTemplates'
import { useEditorStore } from '@/stores/editorStore'
import { usePreviewStore } from '@/stores/previewStore'
import { extractVariables, cn } from '@/lib/utils'

import VisualEditor from '../VisualEditor'
import RawEditor from '../RawEditor'
import TemplatePreview from '../TemplatePreview'
import MockPayloadEditor from '../MockPayloadEditor'

import { AIAssistPanel } from '@/features/ai/components/AIAssistPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Save, Sparkles, Monitor, Smartphone, Send, Loader2 } from 'lucide-react'
import { TestSendDialog } from '../TestSendDialog'
import type { Template } from '@/types/template'

interface TemplateEditorProps {
  initialData?: Template
}

export function TemplateEditor({ initialData }: TemplateEditorProps) {
  const router = useRouter()
  const isEdit = !!initialData


  // Stores
  const { mode, setMode, isAIPanelOpen, toggleAIPanel, detectedVariables, setDetectedVariables, eventType, setEventType } =
    useEditorStore()
  const { viewportMode, setViewportMode } = usePreviewStore()

  // Mutations
  const { mutate: createTemplate, isPending: isCreating } = useCreateTemplate()
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateTemplate()
  const isSaving = isCreating || isUpdating

  // Dialog State
  const [isTestSendOpen, setIsTestSendOpen] = React.useState(false)

  // React Hook Form
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      subject: initialData?.subject ?? '',
      htmlContent: initialData?.htmlContent ?? '<p>Hello {{user.name}}, welcome to our platform!</p>',
      status: initialData ? ((initialData.status === 'active' || initialData.status === 'ACTIVE') ? 'active' : 'draft') : 'active',
    },
  })

  const htmlContent = watch('htmlContent')
  const name = watch('name')
  const subject = watch('subject')
  const status = watch('status')

  // Variable extraction
  React.useEffect(() => {
    const vars = extractVariables(htmlContent)
    setDetectedVariables(vars)
  }, [htmlContent, setDetectedVariables])

  const onSubmit: SubmitHandler<CreateTemplateFormValues> = (values) => {
    if (isEdit && initialData) {
      updateTemplate(
        { id: initialData.id, data: values },
        {
          onSuccess: () => router.push('/templates'),
        }
      )
    } else {
      createTemplate(values, {
        onSuccess: () => router.push('/templates'),
      })
    }
  }

  // AI callbacks to insert or apply subject/body changes
  const handleApplySubject = (newSubject: string) => {
    setValue('subject', newSubject)
  }

  const handleApplyHtml = (newHtml: string) => {
    setValue('htmlContent', newHtml)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/templates')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <PageHeader
            title={isEdit ? `Edit Template: ${initialData.name}` : 'Create Template'}
            description={
              isEdit
                ? 'Update subject, html body, and review variables.'
                : 'Design a reusable template from scratch.'
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggleAIPanel} className="gap-1.5 border border-border/50 text-xs h-9">
            <Sparkles className="size-4 text-purple-500 animate-pulse" />
            AI Co-Pilot
          </Button>
          {isEdit && (
            <Button
              variant="outline"
              onClick={() => setIsTestSendOpen(true)}
              className="gap-1.5 text-xs h-9"
            >
              <Send className="size-4 text-muted-foreground" />
              Test Send
            </Button>
          )}
          <Button onClick={handleSubmit(onSubmit)} disabled={isSaving} className="gap-1.5 text-xs h-9">
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      {/* Main Grid: Left editor, Right preview, Optional Rightmost AI panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start min-h-[600px]">
        {/* Editor pane */}
        <div
          className={cn(
            'flex flex-col gap-4 lg:col-span-6 transition-all duration-300',
            isAIPanelOpen ? 'lg:col-span-5' : 'lg:col-span-6'
          )}
        >
          <Card className="bg-card/30 border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Welcome Onboarding Email"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-[10px] font-medium text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs">Publish Status</Label>
                  <div className="flex h-10 items-center justify-between rounded-lg border border-border/50 px-3 bg-muted/20">
                    <span className="text-xs text-muted-foreground">
                      {status === 'active' ? 'Active (Live)' : 'Draft'}
                    </span>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value === 'active'}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? 'active' : 'draft')
                          }
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs">Email Subject</Label>
                <Input
                  id="subject"
                  placeholder="Welcome {{user.name}}! Get started here"
                  {...register('subject')}
                />
                {errors.subject && (
                  <p className="text-[10px] font-medium text-destructive">{errors.subject.message}</p>
                )}
              </div>

              {/* Toggle Visual / Raw Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">HTML Email Body</Label>
                  <Tabs
                    value={mode}
                    onValueChange={(val) => setMode(val as 'visual' | 'raw')}
                    className="w-auto"
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="visual" className="text-xs py-1">Visual</TabsTrigger>
                      <TabsTrigger value="raw" className="text-xs py-1">HTML Code</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Controller
                  name="htmlContent"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      {mode === 'visual' ? (
                        <VisualEditor
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSaving}
                        />
                      ) : (
                        <RawEditor
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSaving}
                        />
                      )}
                    </div>
                  )}
                />
                {errors.htmlContent && (
                  <p className="text-[10px] font-medium text-destructive">{errors.htmlContent.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Live Preview column */}
        <div
          className={cn(
            'flex flex-col gap-4 lg:col-span-6 transition-all duration-300',
            isAIPanelOpen ? 'lg:col-span-4' : 'lg:col-span-6'
          )}
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Preview
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant={viewportMode === 'desktop' ? 'secondary' : 'ghost'}
                size="icon-sm"
                className="size-7"
                onClick={() => setViewportMode('desktop')}
                aria-label="Desktop preview"
              >
                <Monitor className="size-4" />
              </Button>
              <Button
                variant={viewportMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon-sm"
                className="size-7"
                onClick={() => setViewportMode('mobile')}
                aria-label="Mobile preview"
              >
                <Smartphone className="size-4" />
              </Button>
            </div>
          </div>

          <div className="h-[520px] rounded-xl border border-border/50 bg-card overflow-hidden">
            <TemplatePreview htmlContent={htmlContent} />
          </div>

          <MockPayloadEditor 
            variables={detectedVariables}
            eventType={eventType}
            onEventTypeChange={setEventType}
          />
        </div>

        {/* Collapsible AI Co-Pilot Column */}
        {isAIPanelOpen && (
          <div className="lg:col-span-3 h-full lg:sticky lg:top-20">
            <AIAssistPanel
              currentSubject={subject}
              currentHtml={htmlContent}
              onApplySubject={handleApplySubject}
              onApplyHtml={handleApplyHtml}
            />
          </div>
        )}
      </div>

      {isEdit && initialData && (
        <TestSendDialog
          open={isTestSendOpen}
          onOpenChange={setIsTestSendOpen}
          templateId={initialData.id}
          templateName={initialData.name}
          variables={detectedVariables}
        />
      )}
    </div>
  )
}
