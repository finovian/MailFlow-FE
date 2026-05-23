import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(req: Request) {
  try {
    const { html, extraVariables, availableVariables } = await req.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML is required' }, { status: 400 })
    }

    const systemPrompt = `You are an AI that helps developers map incorrect placeholders in email templates to correct event variables.
Given the HTML template content, find occurrences of the following incorrect placeholders: ${JSON.stringify(extraVariables)}.
Map each incorrect placeholder to the closest matching valid variable from this list: ${JSON.stringify(availableVariables)}.

For example, map:
- {{customer.name}} -> {{user.name}}
- {{order_id}} -> {{event.orderId}} (depending on available variables)

Make these replacements directly in the HTML template.
Return ONLY a JSON object with:
- 'htmlContent': string (the modified HTML template content with corrected placeholders)
- 'mappings': array of objects { from: string, to: string } showing what was mapped
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: html }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error("No content generated")

    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("OpenAI Error:", error)
    return NextResponse.json({ error: error.message || 'Failed to map placeholders' }, { status: 500 })
  }
}
