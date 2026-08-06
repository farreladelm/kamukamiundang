// src/features/ai-match/llm.ts
import "server-only";
import OpenAI from "openai";
import { matchBriefSchema, type MatchBrief } from "./schema";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 20_000;
const TEMPERATURE = 0;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kategori", "nuansa"],
  properties: {
    kategori: { type: ["string", "null"], enum: ["klasik", "modern", "botanical", null] },
    nuansa: { type: ["string", "null"], enum: ["muted", "warm", "bold", null] },
  },
} as const;

const INSTRUCTIONS = [
  "Kamu membaca cerita bebas calon pengantin Indonesia dan menentukan dua hal saja:",
  '1. `kategori`: satu dari "klasik" (adat/tradisional/Jawa), "modern" (minimalis/pantai/outdoor), "botanical" (taman/bunga/alam), atau null kalau tidak jelas.',
  '2. `nuansa`: satu dari "muted" (lembut/pastel/netral), "warm" (hangat/senja/keemasan), "bold" (gelap/dramatis), atau null kalau tidak jelas.',
  "JANGAN mengarang kategori atau nuansa yang tidak tersirat dari teks. Kalau ragu, isi null.",
].join("\n");

export function llmAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function parseWithLlm(cerita: string): Promise<MatchBrief | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create(
      {
        model: MODEL,
        temperature: TEMPERATURE,
        messages: [
          { role: "system", content: INSTRUCTIONS },
          { role: "user", content: cerita },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "match_brief", strict: true, schema: RESPONSE_SCHEMA },
        },
      },
      { timeout: TIMEOUT_MS },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = matchBriefSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch (err) {
    console.error("[ai-match] LLM gagal, beralih ke pencocokan kata kunci:", err);
    return null;
  }
}
