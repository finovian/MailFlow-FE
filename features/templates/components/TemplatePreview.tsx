'use client'

import * as React from 'react'
import { usePreviewStore } from '@/stores/previewStore'
import { useEditorStore } from '@/stores/editorStore'
import { getFieldsForEventType } from '@/constants/eventTypes'
import { cn } from '@/lib/utils'

interface TemplatePreviewProps {
  htmlContent: string
}

export default function TemplatePreview({ htmlContent }: TemplatePreviewProps) {
  const { mockPayload, viewportMode } = usePreviewStore()
  const { eventType } = useEditorStore()

  // Replace placeholders with mock values
  const renderedHtml = React.useMemo(() => {
    let rendered = htmlContent

    Object.entries(mockPayload).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      rendered = rendered.replace(regex, String(value ?? ''))
    })

    // Get field info for the current event type to show types in placeholders
    const fields = getFieldsForEventType(eventType)

    // Clean up any remaining unpopulated braces with placeholder styles
    rendered = rendered.replace(
      /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g,
      (match, varName) => {
        const field = fields.find(f => f.name === varName)
        const typeInfo = field ? `: ${field.type}` : ''
        return `<span style="background-color: rgba(245, 158, 11, 0.2); color: #d97706; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; font-family: monospace;">{{${varName}${typeInfo}}}</span>`
      }
    )

    // Check if the htmlContent already has a full HTML structure
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
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #1f2937;
              background-color: #ffffff;
              line-height: 1.6;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${rendered}
        </body>
      </html>
    `
  }, [htmlContent, mockPayload])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-100/50 p-4 dark:bg-zinc-950/20">
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-border/60 bg-white shadow-lg transition-all duration-300 ease-in-out',
          viewportMode === 'mobile' ? 'h-[640px] w-[375px]' : 'h-full w-full'
        )}
      >
        {/* Frame header simulating a browser tab/device boundary */}
        <div className="flex h-8 items-center gap-1.5 border-b border-border/50 bg-muted/40 px-4">
          <div className="size-2.5 rounded-full bg-red-500/80" />
          <div className="size-2.5 rounded-full bg-yellow-500/80" />
          <div className="size-2.5 rounded-full bg-green-500/80" />
          <div className="mx-auto text-xs text-muted-foreground">Sandbox Preview</div>
        </div>

        <iframe
          srcDoc={renderedHtml}
          title="Template Live Preview"
          className="h-[calc(100%-32px)] w-full border-0 bg-white"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  )
}
