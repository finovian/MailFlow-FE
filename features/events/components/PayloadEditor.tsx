'use client'

import * as React from 'react'
import Editor from '@monaco-editor/react'
import { Loader2, Braces } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PayloadEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string | null
}

export function PayloadEditor({ value, onChange, disabled, error }: PayloadEditorProps) {
  const handleEditorChange = (val: string | undefined) => {
    onChange(val ?? '')
  }

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value)
      const formatted = JSON.stringify(parsed, null, 2)
      onChange(formatted)
    } catch (e) {
      // Ignore formatting if invalid JSON
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Event Payload (JSON)
        </label>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleFormat}
          disabled={disabled}
          className="h-7 text-[10px] gap-1 px-2 border-border/40 hover:bg-muted/50"
        >
          <Braces className="size-3 text-primary" />
          Format JSON
        </Button>
      </div>

      <div className="relative rounded-lg border border-border/40 bg-black/95 overflow-hidden ring-1 ring-border/20">
        <Editor
          height="240px"
          defaultLanguage="json"
          theme="vs-dark"
          value={value}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            readOnly: disabled,
            padding: { top: 12, bottom: 12 },
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
            formatOnType: true,
            formatOnPaste: true,
          }}
          loading={
            <div className="flex h-[240px] items-center justify-center bg-black/95 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin text-primary" />
              <span className="text-xs">Loading payload editor...</span>
            </div>
          }
        />
      </div>
      {error && (
        <p className="text-[11px] text-destructive font-medium mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
export default PayloadEditor
