import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(req: Request) {
  try {
    const { eventType, fields, description } = await req.json()

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    }

    const systemPrompt = `You are an AI assistant that suggests useful trigger conditions for email automation based on the trigger event type.
Event Type: ${eventType}
Description: ${description || 'No description provided'}
Available Fields: ${JSON.stringify(fields)}

Generate 3 logical condition suggestions that a developer might want to apply. For example, filtering by specific email domains, order amounts, or status values.

For each suggestion, provide:
1. 'label': A short, clear description of the suggestion (e.g. "Only Gmail Recipients", "High Value Customers")
2. 'conditions': A ConditionGroup object matching this structure:
   interface ConditionRule {
     field: string
     op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_within_days' | 'is_true' | 'is_false'
     value: string | number | boolean
   }
   interface ConditionGroup {
     operator: 'AND' | 'OR'
     rules: (ConditionRule | ConditionGroup)[]
   }

Return ONLY a JSON object with a single property 'suggestions' which is an array of the 3 suggestions.
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Suggest 3 conditions for event type: ${eventType}` }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error("No content generated")

    const parsed = JSON.parse(content)
    return NextResponse.json({ suggestions: parsed.suggestions || [] })
  } catch (error: any) {
    console.error("OpenAI Error:", error)
    return NextResponse.json({ error: error.message || 'Failed to suggest conditions' }, { status: 500 })
  }
}
