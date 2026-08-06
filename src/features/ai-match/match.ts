import type { TemplateCatalogItem } from "@/features/templates/types";
import type { MatchBrief } from "./schema";
import { PALETTE_INDEX_BY_NUANSA } from "./tags";

export type MatchResult = {
  templateKey: string;
  templateVersion: number;
  slug: string;
  score: number;
  reasons: string[];
  paletteKey: string;
};

const KATEGORI_SCORE = 3;

export function matchTemplates(
  brief: MatchBrief,
  templates: readonly TemplateCatalogItem[],
): MatchResult[] {
  return templates
    .map((template): MatchResult => {
      const reasons: string[] = [];
      let score = 0;

      if (brief.kategori && template.category.toLowerCase() === brief.kategori) {
        score += KATEGORI_SCORE;
        reasons.push(`cocok dengan kategori "${brief.kategori}"`);
      }

      const paletteIndex = brief.nuansa ? PALETTE_INDEX_BY_NUANSA[brief.nuansa] : 0;
      const paletteKey = template.palettes[paletteIndex]?.key ?? template.palettes[0].key;

      return {
        templateKey: template.templateKey,
        templateVersion: template.templateVersion,
        slug: template.slug,
        score,
        reasons,
        paletteKey,
      };
    })
    .sort((a, b) => b.score - a.score);
}
