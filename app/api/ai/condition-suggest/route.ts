import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(req: Request) {
  try {
    const { conditions } = await req.json()

    if (!conditions) {
      return NextResponse.json({ error: 'Conditions are required' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an assistant that explains complex trigger conditions. You will receive a JSON structure representing rules (AND/OR groups). Explain in simple, clear, non-technical English when this trigger will fire. Be concise. Return ONLY a JSON object with an 'explanation' string property."
        },
        {
          role: "user",
          content: JSON.stringify(conditions, null, 2)
        }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error("No content generated")

    const parsed = JSON.parse(content)
    return NextResponse.json({ explanation: parsed.explanation })
  } catch (error: any) {
    console.error("OpenAI Error:", error)
    return NextResponse.json({ error: error.message || 'Failed to explain conditions' }, { status: 500 })
  }
}
