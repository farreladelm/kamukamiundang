import type { Kategori, MatchBrief, Nuansa } from "./schema";
import { KATEGORI_KEYWORDS, NUANSA_KEYWORDS } from "./tags";

function pickFirstMatch<T extends string>(text: string, table: Record<T, readonly string[]>): T | null {
  for (const key of Object.keys(table) as T[]) {
    if (table[key].some((keyword) => text.includes(keyword))) {
      return key;
    }
  }
  return null;
}

export function parseFallback(cerita: string): MatchBrief {
  const text = cerita.toLowerCase();
  return {
    kategori: pickFirstMatch<Kategori>(text, KATEGORI_KEYWORDS),
    nuansa: pickFirstMatch<Nuansa>(text, NUANSA_KEYWORDS),
  };
}
