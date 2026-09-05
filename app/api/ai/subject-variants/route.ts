import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { subject } = await req.json();

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 },
      );
    }

    const response = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert email marketer. Generate 4 creative subject line variants based on the user's input subject. Ensure each variant is unique. Return ONLY a JSON object with a 'variants' array. Each item in the array must be an object with 'subject' (string) and 'tone' (string, e.g., 'urgent', 'casual', 'professional').",
        },
        {
          role: "user",
          content: subject,
        },
      ],
      responseFormat: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content generated");

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed.variants || []);
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate variants" },
      { status: 500 },
    );
  }
}
