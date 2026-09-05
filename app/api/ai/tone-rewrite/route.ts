import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { text, tone } = await req.json();

    if (!text || !tone) {
      return NextResponse.json(
        { error: "Text and tone are required" },
        { status: 400 },
      );
    }

    const response = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert copywriter. Rewrite the user's text to have a ${tone} tone. Make sure the meaning is preserved but the tone is explicitly adapted. Return ONLY a JSON object with a single property 'rewritten' containing the rewritten text string.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      responseFormat: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content generated");

    const parsed = JSON.parse(content);
    return NextResponse.json({ rewritten: parsed.rewritten });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rewrite tone" },
      { status: 500 },
    );
  }
}
