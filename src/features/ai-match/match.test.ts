import { describe, expect, it } from "vitest";
import { matchTemplates } from "./match";
import type { TemplateCatalogItem } from "@/features/templates/types";

function makeTemplate(overrides: Partial<TemplateCatalogItem>): TemplateCatalogItem {
  return {
    templateKey: "template-1",
    templateVersion: 1,
    slug: "larasati",
    name: "Larasati",
    category: "Klasik",
    description: "",
    priceInRupiah: 650000,
    marketingThumbnail: null,
    displayOrder: 10,
    status: "VISIBLE",
    isVisible: true,
    contentSchemaVersion: 2,
    previewStyle: "arch",
    capabilities: [],
    palettes: [
      { key: "gading", name: "Gading", tokens: { canvas: "", surface: "", ink: "", muted: "", accent: "", line: "" } },
      { key: "soga", name: "Soga", tokens: { canvas: "", surface: "", ink: "", muted: "", accent: "", line: "" } },
      { key: "malam", name: "Malam", tokens: { canvas: "", surface: "", ink: "", muted: "", accent: "", line: "" } },
    ],
    demo: { paletteKey: "gading", content: {} as TemplateCatalogItem["demo"]["content"] },
    ...overrides,
  };
}

const templates: TemplateCatalogItem[] = [
  makeTemplate({ templateKey: "template-1", slug: "larasati", category: "Klasik", displayOrder: 10 }),
  makeTemplate({ templateKey: "template-2", slug: "pesisir-senja", category: "Modern", displayOrder: 20 }),
  makeTemplate({ templateKey: "template-3", slug: "taman-aksara", category: "Botanical", displayOrder: 30 }),
];

describe("matchTemplates", () => {
  it("always returns every template, even with an empty brief", () => {
    const results = matchTemplates({ kategori: null, nuansa: null }, templates);
    expect(results).toHaveLength(3);
    expect(results.every((result) => result.score === 0)).toBe(true);
  });

  it("preserves catalog order when scores tie", () => {
    const results = matchTemplates({ kategori: null, nuansa: null }, templates);
    expect(results.map((result) => result.templateKey)).toEqual(["template-1", "template-2", "template-3"]);
  });

  it("ranks the matching category first and explains why", () => {
    const results = matchTemplates({ kategori: "botanical", nuansa: null }, templates);
    expect(results[0].templateKey).toBe("template-3");
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].reasons).toContain('cocok dengan kategori "botanical"');
    expect(results[1].score).toBe(0);
    expect(results[2].score).toBe(0);
  });

  it("maps nuansa to the matching palette index", () => {
    const results = matchTemplates({ kategori: null, nuansa: "bold" }, templates);
    const larasati = results.find((result) => result.templateKey === "template-1");
    expect(larasati?.paletteKey).toBe("malam");
  });

  it("defaults to the first palette when nuansa is null", () => {
    const results = matchTemplates({ kategori: null, nuansa: null }, templates);
    const larasati = results.find((result) => result.templateKey === "template-1");
    expect(larasati?.paletteKey).toBe("gading");
  });
});
