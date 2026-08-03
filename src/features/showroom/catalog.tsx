"use client";

import { useState } from "react";
import type { TemplateCatalogItem } from "@/features/templates/types";

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
}: {
  templates: readonly TemplateCatalogItem[];
}) {
  const visibleTemplates = templates.filter((template) => template.isVisible);
  const categories = [
    allCategoriesLabel,
    ...Array.from(new Set(visibleTemplates.map((template) => template.category))),
  ];
  const [activeCategory, setActiveCategory] = useState(allCategoriesLabel);
  const filteredTemplates = visibleTemplates.filter(
    (template) =>
      activeCategory === allCategoriesLabel || template.category === activeCategory,
  );

  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8" aria-labelledby="collection-title">
      <div className="border-t border-stone-300 pt-8 sm:flex sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">
            Koleksi perdana
          </p>
          <h2 id="collection-title" className="mt-2 font-serif text-4xl text-stone-900 sm:text-5xl">
            Pilih nuansa yang terasa seperti kalian.
          </h2>
        </div>
        <p className="mt-4 max-w-sm text-sm leading-6 text-stone-600 sm:text-right">
          Tiga desain siap personalisasi, dengan palet terkurasi dan harga yang jelas.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2" aria-label="Filter kategori template" role="toolbar">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className="border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 aria-pressed:bg-stone-900 aria-pressed:text-stone-50"
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
          const palette = template.palettes[0];

          return (
            <article key={`${template.templateKey}-${template.templateVersion}`} className="border border-stone-300 bg-white p-3">
              <div
                className={`template-thumbnail template-thumbnail-${template.previewStyle} aspect-[4/5] p-5`}
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
              <div className="px-2 pb-2 pt-5">
                <p className="text-xs font-semibold tracking-[0.15em] text-stone-500 uppercase">
                  {template.category}
                </p>
                <h3 className="mt-2 font-serif text-3xl text-stone-900">{template.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-stone-600">{template.description}</p>
                <p className="mt-5 border-t border-stone-200 pt-4 text-sm font-semibold text-stone-900">
                  Mulai {formatRupiah(template.priceInRupiah)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
