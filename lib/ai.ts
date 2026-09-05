import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

type AIProvider = "groq" | "gemini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: { type: "json_object" };
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

export const ai = {
  chat: {
    completions: {
      create: async (
        options: ChatCompletionOptions,
      ): Promise<ChatCompletionResponse> => {
        const provider = getAIProvider();
        const keyName = provider === "groq" ? "GROQ_API_KEY" : "GEMINI_API_KEY";
        const apiKey = process.env[keyName]?.trim();
        if (!apiKey)
          throw new Error(
            `${keyName} is required when AI_PROVIDER=${provider}`,
          );
        const model =
          options.model ||
          (provider === "groq"
            ? process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b"
            : process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash");

        if (provider === "groq") {
          const groqClient = new Groq({ apiKey });
          const response = await groqClient.chat.completions.create({
            model,
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
            response_format: options.responseFormat,
          });
          return {
            choices: [
              {
                message: {
                  content: response.choices[0]?.message?.content ?? null,
                },
              },
            ],
          };
        } else {
          const geminiClient = new GoogleGenerativeAI(apiKey);
          const geminiModel = geminiClient.getGenerativeModel({
            model,
            systemInstruction:
              options.messages
                .filter((m) => m.role === "system")
                .map((m) => m.content)
                .join("\n\n") || undefined,
            generationConfig: {
              temperature: options.temperature ?? 0.7,
              ...(options.responseFormat?.type === "json_object"
                ? { responseMimeType: "application/json" }
                : {}),
            },
          });
          const result = await geminiModel.generateContent({
            contents: options.messages
              .filter((m) => m.role !== "system")
              .map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              })),
          });
          const text = result.response.text();

          return {
            choices: [
              {
                message: {
                  content: text,
                },
              },
            ],
          };
        }
      },
    },
  },
};

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() || "groq";
  if (provider !== "groq" && provider !== "gemini") {
    throw new Error('AI_PROVIDER must be "groq" or "gemini"');
  }
  return provider;
}
