import { createBasicEventRateLimiter } from "@/features/analytics/basic-events";
import { parseWithLlm } from "@/features/ai-match/llm";
import { matchTemplates } from "@/features/ai-match/match";
import { parseFallback } from "@/features/ai-match/rule-fallback";
import { getVisibleTemplateCatalogFromDatabase } from "@/features/templates/visibility";

export const runtime = "nodejs";

const maxBodyBytes = 4_096;
const maxCeritaLength = 2_000;

const aiMatchRateLimiter = createBasicEventRateLimiter({ max: 10, windowMs: 60_000 });

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return new Response(null, { status: 413 });
  }

  if (!aiMatchRateLimiter.allow(Date.now())) {
    return new Response(null, { status: 429 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await request.text());
  } catch {
    return Response.json({ pesan: "Body bukan JSON yang sah." }, { status: 400 });
  }

  const body = parsed && typeof parsed === "object" ? (parsed as { cerita?: unknown }) : {};
  const cerita = typeof body.cerita === "string" ? body.cerita.trim().slice(0, maxCeritaLength) : "";
  if (!cerita) {
    return Response.json({ pesan: "Cerita tidak boleh kosong." }, { status: 400 });
  }

  const fromLlm = await parseWithLlm(cerita);
  const brief = fromLlm ?? parseFallback(cerita);
  const source: "llm" | "fallback" = fromLlm ? "llm" : "fallback";

  const templates = await getVisibleTemplateCatalogFromDatabase();
  const results = matchTemplates(brief, templates);

  return Response.json({ source, results });
}
