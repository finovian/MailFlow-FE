import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}


const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365.25 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30.44 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
]


export function formatRelativeTime(date: string): string {
  const elapsed = new Date(date).getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (Math.abs(elapsed) >= ms || unit === 'second') {
      return rtf.format(Math.round(elapsed / ms), unit)
    }
  }

  return 'just now'
}


export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}…`
}


export function extractVariables(html: string): string[] {
  const regex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g
  const variables = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const varName = match[1]?.trim()
    if (varName && !varName.includes('..') && !varName.startsWith('.') && !varName.endsWith('.')) {
      variables.add(varName)
    }
  }

  return Array.from(variables)
}
