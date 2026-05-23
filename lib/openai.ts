import OpenAI from 'openai'

export const openai = new OpenAI({
  baseURL: process.env.MODEL_BASE_URL,
  apiKey: process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY,
})
