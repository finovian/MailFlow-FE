import { NextResponse } from 'next/server'
import { getFieldsForEventType, type EventType } from '@/constants/eventTypes'
import { openai } from '@/lib/openai'

export async function POST(req: Request) {
  try {
    const { html, eventType } = await req.json()

    if (!html || !eventType) {
      return NextResponse.json({ error: 'HTML and eventType are required' }, { status: 400 })
    }

    const availableFields = getFieldsForEventType(eventType as EventType).map(f => f.name)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI that validates variables in HTML templates. 
Available variables for the selected event type are: ${availableFields.join(', ')}.
Analyze the provided HTML and extract all placeholders (e.g., {{variable.name}}).
Return ONLY a JSON object with three arrays of strings:
- 'valid': placeholders found in the HTML that MATCH the available variables.
- 'missing': available variables that are NOT used in the HTML (limit to 3).
- 'extra': placeholders found in the HTML that are NOT in the available variables.`
        },
        {
          role: "user",
          content: html
        }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error("No content generated")

    const parsed = JSON.parse(content)
    return NextResponse.json({
      valid: parsed.valid || [],
      missing: parsed.missing || [],
      extra: parsed.extra || [],
    })
  } catch (error: any) {
    console.error("OpenAI Error:", error)
    return NextResponse.json({ error: error.message || 'Failed to validate placeholders' }, { status: 500 })
  }
}
