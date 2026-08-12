"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TemplateCatalogItem } from "@/features/templates/types";
import { WhatsAppCta } from "@/features/showroom/whatsapp-cta";
import type { MatchResult } from "@/features/ai-match/match";

const allCategoriesLabel = "Semua";

function formatRupiah(priceInRupiah: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(priceInRupiah);
}

export function Catalog({
  templates,
  canonicalOrigin = "",
  matchResults,
  afterIntro,
}: {
  templates: readonly TemplateCatalogItem[];
  canonicalOrigin?: string;
  matchResults?: readonly MatchResult[];
  /** Slot rendered between the collection heading and the filter chips — used for the AI-match helper. */
  afterIntro?: React.ReactNode;
}) {
  const visibleTemplates = templates.filter((template) => template.isVisible);
  const categories = [
    allCategoriesLabel,
    ...Array.from(new Set(visibleTemplates.map((template) => template.category))),
  ];
  const [activeCategory, setActiveCategory] = useState(allCategoriesLabel);
  const rankByTemplateKey = new Map(matchResults?.map((result, index) => [result.templateKey, index]));
  const bestMatch = matchResults?.[0];
  const filteredTemplates = visibleTemplates
    .filter(
      (template) =>
        activeCategory === allCategoriesLabel || template.category === activeCategory,
    )
    .slice()
    .sort(
      (a, b) =>
        (rankByTemplateKey.get(a.templateKey) ?? Infinity) -
        (rankByTemplateKey.get(b.templateKey) ?? Infinity),
    );

  useEffect(() => {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "template_list_viewed",
        properties: { category: activeCategory },
      }),
    }).catch(() => undefined);
  }, [activeCategory]);

  return (
    <section className="mx-auto max-w-6xl px-5 pt-6 pb-20 sm:px-8 sm:pt-10 sm:pb-28" aria-labelledby="collection-title">
      <div className="sm:flex sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">
            Koleksi perdana
          </p>
          <h2 id="collection-title" className="mt-2 font-serif text-4xl text-stone-900 sm:text-5xl">
            Pilih nuansa yang terasa seperti kalian.
          </h2>
        </div>
        <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600 sm:text-right">
          Kami udah kurasi tiga desain, tinggal kalian sesuaikan ceritanya biar tamu yang buka
          langsung kerasa bedanya.
        </p>
      </div>

      {afterIntro}

      <div className="mt-8 flex flex-wrap items-center gap-2" aria-label="Filter kategori template" role="toolbar">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 aria-pressed:border-stone-900 aria-pressed:bg-stone-900 aria-pressed:text-stone-50"
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
        <button
          type="button"
          className="ml-1 px-3 py-2 text-sm font-medium text-stone-600 underline decoration-stone-400 underline-offset-4 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Tampilkan semua template"
          disabled={activeCategory === allCategoriesLabel}
          onClick={() => setActiveCategory(allCategoriesLabel)}
        >
          Reset filter
        </button>
      </div>

      <p className="mt-5 text-sm text-stone-600" aria-live="polite">
        Menampilkan {filteredTemplates.length} template.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {filteredTemplates.map((template) => {
          const isRecommended =
            bestMatch !== undefined && bestMatch.score > 0 && bestMatch.templateKey === template.templateKey;
          const palette =
            (isRecommended && template.palettes.find((candidate) => candidate.key === bestMatch.paletteKey)) ||
            template.palettes[0];

          return (
            <article
              key={`${template.templateKey}-${template.templateVersion}`}
              className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-3 shadow-[0_2px_10px_-4px_rgba(41,37,36,0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_35px_60px_-30px_rgba(41,37,36,0.35)]"
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
                event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(280px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(180, 131, 61, 0.16), transparent 70%)",
                }}
              />
              <div
                className={`template-thumbnail template-thumbnail-${template.previewStyle} aspect-[4/5] overflow-hidden rounded-2xl p-5 transition-transform duration-500 group-hover:scale-[1.02]`}
                style={{
                  backgroundColor: palette.tokens.canvas,
                  color: palette.tokens.ink,
                  "--thumbnail-accent": palette.tokens.accent,
                  "--thumbnail-line": palette.tokens.line,
                  "--thumbnail-surface": palette.tokens.surface,
                } as React.CSSProperties}
                aria-hidden="true"
              >
                <span className="template-thumbnail-mark">{template.name.slice(0, 1)}</span>
                <span className="template-thumbnail-copy">{template.category}</span>
              </div>
              <div className="flex flex-1 flex-col px-2 pt-5 pb-2">
                <p className="text-xs font-semibold tracking-[0.15em] text-stone-500 uppercase">
                  {template.category}
                </p>
                {isRecommended && (
                  <p className="mt-2 inline-block w-fit rounded-full bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50">
                    Cocok untukmu
                  </p>
                )}
                <h3 className="mt-2 font-serif text-3xl text-stone-900">{template.name}</h3>
                {isRecommended && bestMatch.reasons.length > 0 && (
                  <p className="mt-1 text-xs text-amber-900">{bestMatch.reasons.join(", ")}</p>
                )}
                <p className="mt-3 min-h-12 text-sm leading-6 text-stone-600">{template.description}</p>
                <div className="flex-1" />
                <p className="mt-5 border-t border-stone-200 pt-4 text-sm font-semibold text-stone-900">
                  Mulai {formatRupiah(template.priceInRupiah)}
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Link
                    href={`/templates/${template.slug}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-stone-900 px-3 text-center text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-900 hover:text-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
                  >
                    Preview
                  </Link>
                  <WhatsAppCta
                    whatsappNumber="6282131401640"
                    canonicalUrl={`${canonicalOrigin}/templates/${template.slug}`}
                    template={template}
                    palette={palette}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-stone-900 px-3 text-center text-sm font-semibold text-stone-50 transition-colors hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
