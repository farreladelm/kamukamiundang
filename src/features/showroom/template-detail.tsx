"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WhatsAppCta } from "@/features/showroom/whatsapp-cta";
import { renderTemplate } from "@/features/templates/render-template";
import { getTemplateDefinition } from "@/features/templates/registry";

export function TemplateDetail({
  templateKey,
  templateVersion,
  canonicalUrl,
}: {
  templateKey: string;
  templateVersion: number;
  canonicalUrl: string;
}) {
  const template = getTemplateDefinition(templateKey, templateVersion);

  if (!template) {
    throw new Error(`Unknown template ${templateKey} v${templateVersion}`);
  }

  const [paletteKey, setPaletteKey] = useState(template.demo.paletteKey);

  useEffect(() => {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "template_detail_viewed",
        properties: { templateKey, templateVersion },
      }),
    }).catch(() => undefined);
  }, [templateKey, templateVersion]);

  function selectPalette(nextPaletteKey: string) {
    setPaletteKey(nextPaletteKey);
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "template_palette_selected",
        properties: { templateKey, templateVersion, paletteKey: nextPaletteKey },
      }),
    }).catch(() => undefined);
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-8 text-stone-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-semibold text-stone-700 underline decoration-stone-400 underline-offset-4 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
        >
          Kembali ke koleksi
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
          <aside className="border-y border-stone-300 py-6 lg:border-y-0 lg:border-r lg:pr-8">
            <p className="text-xs font-semibold tracking-[0.16em] text-stone-500 uppercase">
              {template.category}
            </p>
            <h1 className="mt-2 font-serif text-4xl text-stone-900">{template.name}</h1>
            <p className="mt-4 text-sm leading-6 text-stone-600">{template.description}</p>
            <fieldset className="mt-8">
              <legend className="text-sm font-semibold text-stone-900">Pilih palet</legend>
              <div className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:items-start">
                {template.palettes.map((palette) => (
                  <button
                    key={palette.key}
                    type="button"
                    className="border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 aria-pressed:border-stone-900 aria-pressed:bg-stone-900 aria-pressed:text-stone-50"
                    aria-pressed={paletteKey === palette.key}
                    onClick={() => selectPalette(palette.key)}
                  >
                    {palette.name}
                  </button>
                ))}
              </div>
            </fieldset>
            <WhatsAppCta
              whatsappNumber="6282131401640"
              canonicalUrl={canonicalUrl}
              template={template}
              palette={template.palettes.find((palette) => palette.key === paletteKey)!}
            />
          </aside>
          <div data-testid="template-demo">
            {renderTemplate(template, paletteKey, template.demo.content)}
          </div>
        </div>
      </div>
    </main>
  );
}
