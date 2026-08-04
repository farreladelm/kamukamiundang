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

  const [paletteKey, setPaletteKey] = useState(template.demo.paletteKey);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const selectedPalette = template.palettes.find((palette) => palette.key === paletteKey)!;

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
    <main className="min-h-screen bg-stone-950 text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[120rem] flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        <section
          data-testid="preview-cover"
          className="relative hidden min-h-[35rem] flex-1 flex-col justify-between overflow-hidden p-6 sm:p-10 lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-0 lg:p-16"
          style={{ backgroundColor: selectedPalette.tokens.canvas, color: selectedPalette.tokens.ink }}
        >
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 opacity-75" style={{ background: `linear-gradient(135deg, ${selectedPalette.tokens.surface}, ${selectedPalette.tokens.canvas} 48%, ${selectedPalette.tokens.accent}66)` }} />
            <div className="absolute top-1/2 left-1/2 aspect-[3/4] w-[min(42vw,30rem)] -translate-x-1/2 -translate-y-1/2 border border-current opacity-35" />
            <div className="absolute top-[18%] left-[18%] h-28 w-28 rounded-full border opacity-35" style={{ borderColor: selectedPalette.tokens.accent }} />
            <div className="absolute right-[14%] bottom-[14%] h-56 w-56 rounded-full border opacity-25" style={{ borderColor: selectedPalette.tokens.line }} />
          </div>
          <div className="relative z-10 flex justify-end">
            <span className="text-xs font-semibold tracking-[0.16em] uppercase opacity-60">
              Preview publik
            </span>
          </div>

          <div className="relative z-10 max-w-xl py-16 lg:py-8">
            <p
              className="text-xs font-semibold tracking-[0.24em] uppercase"
              style={{ color: selectedPalette.tokens.accent }}
            >
              {template.category}
            </p>
            <h1 className="mt-2 font-serif text-3xl">{template.name}</h1>
            <p className="mt-8 font-serif text-[clamp(3.5rem,8vw,8rem)] leading-[0.86]">
              {template.demo.content.couple.firstName}
              <span className="block pl-[0.6em] italic opacity-50">&amp;</span>
              <span className="block">{template.demo.content.couple.secondName}</span>
            </p>
            <p className="mt-8 max-w-sm text-sm leading-7 opacity-70">
              {template.demo.content.eventDate}. {template.description}
             </p>
          </div>

          <div className="relative z-10 border-t pt-5" style={{ borderColor: selectedPalette.tokens.line }}>
            <p className="max-w-xs text-xs leading-5 opacity-60">
              Invitation dirancang untuk dibaca nyaman dari layar ponsel.
            </p>
          </div>

        </section>

        <section
          data-testid="invitation-scroll"
          className="flex w-full justify-center overflow-y-visible lg:h-screen lg:w-[30rem] lg:shrink-0 lg:overflow-y-auto"
          style={{ backgroundColor: selectedPalette.tokens.canvas }}
        >
          <div
            data-testid="invitation-frame"
            className="h-fit w-full overflow-hidden bg-white"
          >
            <div data-testid="template-demo">
      {renderTemplate(runtime, paletteKey, {
                 ...template.demo.content,
                 cover: { ...template.demo.content.cover, recipientName },
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed right-5 bottom-5 z-30 sm:right-8 sm:bottom-8">
        {isPaletteOpen && (
          <div
            id="palette-picker"
            role="dialog"
            aria-label="Pilihan palet"
            className="absolute right-0 bottom-16 w-56 border border-stone-200 bg-white p-3 text-stone-900 shadow-2xl"
          >
            <p className="px-2 pb-2 text-xs font-semibold tracking-[0.16em] text-stone-500 uppercase">
              Pilih palet
            </p>
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
