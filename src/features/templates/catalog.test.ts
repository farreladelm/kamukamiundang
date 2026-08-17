import { describe, expect, it } from "vitest";
import {
  listVisibleTemplateCatalogWithClient,
  resolveTemplateCatalogRecord,
  resolveTemplateCatalogBySlugWithClient,
  type TemplateCatalogDatabaseRecord,
} from "@/features/templates/catalog";
import { templateRegistry } from "@/features/templates/registry";

const catalogRecord: TemplateCatalogDatabaseRecord = {
  id: "catalog-1",
  templateKey: "template-1",
  templateVersion: 1,
  slug: "larasati",
  name: "Larasati dari Database",
  description: "Metadata database",
  priceInRupiah: 825000,
  marketingThumbnail: null,
  displayOrder: 10,
  status: "VISIBLE",
  category: { key: "klasik", name: "Klasik" },
  slugAliases: [{ slug: "larasati", isCurrent: true }],
};

describe("template catalog resolver", () => {
  it("joins database metadata with exact runtime and preserves nullable thumbnail", () => {
    const resolved = resolveTemplateCatalogRecord(catalogRecord, templateRegistry);

    expect(resolved).toMatchObject({
      templateKey: "template-1",
      templateVersion: 1,
      name: "Larasati dari Database",
      priceInRupiah: 825000,
      marketingThumbnail: null,
      category: "Klasik",
      previewStyle: "arch",
      contentSchemaVersion: 2,
    });
    expect(resolved).not.toHaveProperty("slug", "source-slug");
  });

  it("fails closed when database metadata has no exact runtime", () => {
    const result = resolveTemplateCatalogRecord(
      { ...catalogRecord, templateKey: "missing-runtime" },
      templateRegistry,
    );

    expect(result).toEqual({
      ok: false,
      reason: "MISSING_RUNTIME",
      templateKey: "missing-runtime",
      templateVersion: 1,
    });
  });

  it("fails closed when runtime has no database metadata", () => {
    expect(
      resolveTemplateCatalogRecord(null, templateRegistry, {
        templateKey: "template-1",
        templateVersion: 1,
      }),
    ).toEqual({
      ok: false,
      reason: "MISSING_METADATA",
      templateKey: "template-1",
      templateVersion: 1,
    });
  });

  it("rejects incompatible schema and palette pins", () => {
    expect(
      resolveTemplateCatalogRecord(catalogRecord, templateRegistry, {
        expectedContentSchemaVersion: 99,
      }),
    ).toMatchObject({ ok: false, reason: "INCOMPATIBLE_RUNTIME" });

    expect(
      resolveTemplateCatalogRecord(catalogRecord, templateRegistry, {
        paletteKey: "missing-palette",
      }),
    ).toMatchObject({ ok: false, reason: "INCOMPATIBLE_RUNTIME" });
  });

  it("excludes visible metadata without an exact runtime from public lists", async () => {
    const templates = await listVisibleTemplateCatalogWithClient(
      {
        templateCatalog: {
          findMany: async () => [
            { ...catalogRecord, templateKey: "missing-runtime" },
            catalogRecord,
            { ...catalogRecord, templateKey: "template-2", slug: "pesisir-senja" },
          ],
          findFirst: async () => null,
          findUnique: async () => null,
        },
      },
      [templateRegistry[0]],
    );

    expect(templates).toEqual([
      expect.objectContaining({
        templateKey: "template-1",
        name: "Larasati dari Database",
        priceInRupiah: 825000,
      }),
    ]);
  });

  it("resolves a visible alias to its database canonical slug", async () => {
    const resolved = await resolveTemplateCatalogBySlugWithClient(
      {
        templateCatalog: {
          findMany: async () => [],
          findFirst: async () => catalogRecord,
          findUnique: async () => null,
        },
      },
      "larasati-lama",
      [templateRegistry[0]],
    );

    expect(resolved).toMatchObject({
      slug: "larasati",
      name: "Larasati dari Database",
      isVisible: true,
    });
  });
});
