import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
let sequence = 0;

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
});

async function loadAI(provider, model) {
  process.env.AI_PROVIDER = provider;
  process.env.GROQ_API_KEY = "test-key";
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GROQ_MODEL;
  delete process.env.GEMINI_MODEL;
  if (model) process.env[`${provider.toUpperCase()}_MODEL`] = model;
  return import(`../lib/ai.ts?test=${sequence++}`);
}

const options = {
  messages: [
    { role: "system", content: "Return a JSON object with variants." },
    { role: "user", content: "Welcome aboard" },
  ],
  temperature: 0.2,
  responseFormat: { type: "json_object" },
};

test("Groq uses a supported default and preserves JSON output", async () => {
  let body;
  globalThis.fetch = async (_url, init) => {
    body = JSON.parse(init.body);
    return Response.json({
      choices: [{ message: { content: '{"variants":[]}' } }],
    });
  };
  const { ai } = await loadAI("groq");
  const result = await ai.chat.completions.create(options);
  assert.equal(body.model, "openai/gpt-oss-20b");
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.equal(result.choices[0].message.content, '{"variants":[]}');
});

test("Groq allows a configured model override", async () => {
  let body;
  globalThis.fetch = async (_url, init) => {
    body = JSON.parse(init.body);
    return Response.json({ choices: [{ message: { content: "{}" } }] });
  };
  const { ai } = await loadAI("groq", "llama-3.1-8b-instant");
  await ai.chat.completions.create(options);
  assert.equal(body.model, "llama-3.1-8b-instant");
});

test("Gemini sends JSON mode, temperature, system instruction and structured turns", async () => {
  let url, body;
  globalThis.fetch = async (input, init) => {
    url = String(input);
    body = JSON.parse(init.body);
    return Response.json({
      candidates: [
        {
          content: { parts: [{ text: '{"variants":[]}' }], role: "model" },
          finishReason: "STOP",
        },
      ],
    });
  };
  const { ai } = await loadAI("gemini");
  const result = await ai.chat.completions.create(options);
  assert.match(url, /gemini-2\.5-flash:generateContent/);
  assert.equal(body.generationConfig.responseMimeType, "application/json");
  assert.equal(body.generationConfig.temperature, 0.2);
  assert.equal(
    body.systemInstruction.parts[0].text,
    options.messages[0].content,
  );
  assert.deepEqual(body.contents, [
    { role: "user", parts: [{ text: "Welcome aboard" }] },
  ]);
  assert.equal(result.choices[0].message.content, '{"variants":[]}');
});

test("missing provider key identifies the configuration to fix", async () => {
  globalThis.fetch = async () => {
    throw new Error("Unexpected network request");
  };
  const { ai } = await loadAI("groq");
  delete process.env.GROQ_API_KEY;
  await assert.rejects(ai.chat.completions.create(options), /GROQ_API_KEY/);
});

test("invalid provider has an actionable error", async () => {
  const { ai } = await loadAI("invalid");
  await assert.rejects(
    ai.chat.completions.create(options),
    /AI_PROVIDER must be/,
  );
});
