'use client'

import * as React from 'react'
import { useTemplate } from '@/features/templates/hooks/useTemplates'
import { TemplateEditor } from '@/features/templates/components/TemplateEditor'
import { Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TemplateEditPage({ params }: PageProps) {
  const { id } = React.use(params)
  const { data: template, isLoading, error } = useTemplate(id)

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-2">
        <p className="text-destructive font-medium">Failed to load template</p>
        <p className="text-xs text-muted-foreground">
          {error instanceof Error ? error.message : 'Template not found'}
        </p>
      </div>
    )
  }

  return <TemplateEditor initialData={template} />
}
