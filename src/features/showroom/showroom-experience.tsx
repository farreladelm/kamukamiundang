"use client";

import { useState } from "react";
import { AiMatchBox, type AiMatchResponse } from "./ai-match-box";
import { Catalog } from "./catalog";
import type { TemplateCatalogItem } from "@/features/templates/types";

export function ShowroomExperience({
  templates,
  canonicalOrigin,
}: {
  templates: readonly TemplateCatalogItem[];
  canonicalOrigin?: string;
}) {
  const [match, setMatch] = useState<AiMatchResponse | null>(null);

  return (
    <Catalog
      templates={templates}
      canonicalOrigin={canonicalOrigin}
      matchResults={match?.results}
      afterIntro={
        <>
          <AiMatchBox onMatched={setMatch} />
          {match?.source === "fallback" && (
            <p role="status" className="mt-2 text-xs leading-relaxed text-amber-900">
              Pakai mode sederhana, hasilnya mungkin kurang presisi.
            </p>
          )}
        </>
      }
    />
  );
}
