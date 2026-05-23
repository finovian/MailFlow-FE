import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(req: Request) {
  try {
    const { prompt, events, templates } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const eventsFormatted = (events || []).map((e: any) => ({
      type: e.type,
      label: e.label,
      description: e.description,
      fields: e.fields.map((f: any) => `${f.name} (${f.type})`)
    }))

    const templatesFormatted = (templates || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      subject: t.subject
    }))

    const systemPrompt = `You are an expert system builder for an email automation platform.
Your job is to translate a user's natural language request into a valid trigger configuration object.

Available Events:
${JSON.stringify(eventsFormatted, null, 2)}

Available Templates:
${JSON.stringify(templatesFormatted, null, 2)}

Based on the user prompt, determine the best eventType, best templateId (from available templates, choose the one with closest name/subject match or default to first if none match, or return null if none match), recipientField (should be a field from the selected event type that ends with 'email' e.g. 'user.email'), name for the trigger, conditions (ConditionGroup object with AND/OR operator and rules), cooldownDays (number, default 0), and sendOnce (boolean, default false).

Rules for Conditions:
- The condition group should be a valid JSON representation matching:
  interface ConditionRule {
    field: string
    op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_within_days' | 'is_true' | 'is_false'
    value: string | number | boolean
  }
  interface ConditionGroup {
    operator: 'AND' | 'OR'
    rules: (ConditionRule | ConditionGroup)[]
  }
- Match fields from the selected event's fields.

Return ONLY a JSON object with:
- 'name': string (clear short name for the trigger)
- 'eventType': string (one of the available event types)
- 'templateId': string or null (one of the available template IDs)
- 'recipientField': string (the field to send to, e.g. user.email)
- 'conditions': ConditionGroup (logical conditions, empty rules list if no conditions are requested)
- 'cooldownDays': number
- 'sendOnce': boolean
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error("No content generated")

    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("OpenAI Error:", error)
    return NextResponse.json({ error: error.message || 'Failed to generate trigger' }, { status: 500 })
  }
}
