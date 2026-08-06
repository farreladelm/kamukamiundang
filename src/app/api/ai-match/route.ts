import { parseWithLlm } from "@/features/ai-match/llm";
import { matchTemplates } from "@/features/ai-match/match";
import { parseFallback } from "@/features/ai-match/rule-fallback";
import { getVisibleTemplateCatalogFromDatabase } from "@/features/templates/visibility";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: { cerita?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return Response.json({ pesan: "Body bukan JSON yang sah." }, { status: 400 });
  }

  const cerita = typeof body.cerita === "string" ? body.cerita.trim() : "";
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
