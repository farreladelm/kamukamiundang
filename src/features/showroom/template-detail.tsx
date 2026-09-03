"use client";

import { useEffect, useState } from "react";
import { renderTemplate } from "@/features/templates/render-template";
import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import type { TemplateCatalogItem } from "@/features/templates/types";

export function TemplateDetail({
  template,
  recipientName = "Nama Tamu",
}: {
  template: TemplateCatalogItem;
  recipientName?: string;
}) {
  const runtime = getTemplateRuntimeManifest(template.templateKey, template.templateVersion);

  if (!runtime) {
    throw new Error(`Unknown template ${template.templateKey} v${template.templateVersion}`);
  }

  const isEditorialPreview = template.templateKey === "template-7";

  const [paletteKey, setPaletteKey] = useState(template.demo.paletteKey);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const selectedPalette = template.palettes.find((palette) => palette.key === paletteKey)!;

  useEffect(() => {
    if (!isPaletteOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsPaletteOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaletteOpen]);

  useEffect(() => {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "template_detail_viewed",
          properties: { templateKey: template.templateKey, templateVersion: template.templateVersion },
      }),
    }).catch(() => undefined);
  }, [template.templateKey, template.templateVersion]);

  function selectPalette(nextPaletteKey: string) {
    setPaletteKey(nextPaletteKey);
    setIsPaletteOpen(false);
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "template_palette_selected",
        properties: {
          templateKey: template.templateKey,
          templateVersion: template.templateVersion,
          paletteKey: nextPaletteKey,
        },
      }),
    }).catch(() => undefined);
  }

  return (
    <main className="min-h-dvh bg-stone-950 text-stone-900">
      <div data-testid="template-demo">
        {renderTemplate(runtime, paletteKey, {
          ...template.demo.content,
          cover: { ...template.demo.content.cover, recipientName },
        })}
      </div>

      <div className="fixed right-5 bottom-5 z-30 sm:right-8 sm:bottom-8">
        {isPaletteOpen && (
          <div
            id="palette-picker"
            role="dialog"
            aria-label="Pilihan palet"
            className="absolute right-0 bottom-16 w-56 border border-stone-200 bg-white p-3 text-stone-900 shadow-2xl"
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <p className="text-xs font-semibold tracking-[0.16em] text-stone-500 uppercase">Pilih palet</p>
              <button
                type="button"
                aria-label="Tutup pilihan palet"
                className="flex size-6 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-900"
                onClick={() => setIsPaletteOpen(false)}
              >
                <span aria-hidden="true" className="text-base leading-none">×</span>
              </button>
            </div>
            <div className="grid gap-1">
              {template.palettes.map((palette) => (
                <button
                  key={palette.key}
                  type="button"
                  className="flex min-h-11 items-center gap-3 px-2 text-left text-sm font-medium transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-stone-900"
                  aria-pressed={paletteKey === palette.key}
                  onClick={() => selectPalette(palette.key)}
                >
                  <span
                    className="size-6 shrink-0 rounded-full border border-stone-300"
                    style={{ backgroundColor: palette.tokens.accent }}
                    aria-hidden="true"
                  />
                  <span>{palette.name}</span>
                  {paletteKey === palette.key && <span className="ml-auto text-xs">Aktif</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          aria-expanded={isPaletteOpen}
          aria-controls="palette-picker"
          aria-label="Buka pilihan palet"
          className="flex min-h-12 items-center gap-2 border border-white/30 bg-stone-900 px-4 text-sm font-semibold text-white shadow-xl transition-colors hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          onClick={() => setIsPaletteOpen((open) => !open)}
        >
          <span className="size-4 rounded-full border border-white/50" style={{ backgroundColor: selectedPalette.tokens.accent }} aria-hidden="true" />
          Palet: {selectedPalette.name}
        </button>
      </div>
    </main>
  );
}
