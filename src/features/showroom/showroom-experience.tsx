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
    <>
      <AiMatchBox onMatched={setMatch} />
      {match?.source === "fallback" && (
        <p role="status" className="mx-auto max-w-3xl px-5 pb-6 text-xs leading-relaxed text-amber-900 sm:px-8">
          Pakai mode sederhana — hasilnya mungkin kurang presisi.
        </p>
      )}
      <Catalog templates={templates} canonicalOrigin={canonicalOrigin} matchResults={match?.results} />
    </>
  );
}
