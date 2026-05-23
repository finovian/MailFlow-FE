'use client'

import * as React from 'react'
import Editor from '@monaco-editor/react'
import { Loader2 } from 'lucide-react'

interface RawEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function RawEditor({ value, onChange, disabled }: RawEditorProps) {
  const handleEditorChange = (val: string | undefined) => {
    onChange(val ?? '')
  }

  return (
    <div className="relative rounded-lg border border-border/50 bg-black/95 overflow-hidden">
      <Editor
        height="350px"
        defaultLanguage="html"
        theme="vs-dark"
        value={value}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          readOnly: disabled,
          padding: { top: 12 },
          automaticLayout: true,
          wordWrap: 'on',
        }}
        loading={
          <div className="flex h-[350px] items-center justify-center bg-black/95 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin text-primary" />
            <span>Loading editor...</span>
          </div>
        }
      />
    </div>
  )
}
