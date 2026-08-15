import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import {
  getVisibleTemplateCatalog,
  resolveTemplateCatalogBySlug,
} from "@/features/templates/catalog";
import { reconcileTemplateCatalog } from "@/features/templates/catalog-reconciliation";

async function resetCatalog() {
  await db.$executeRawUnsafe('TRUNCATE TABLE "TemplateSlugAlias", "TemplateCatalog" CASCADE');
  await reconcileTemplateCatalog();
  await db.templateCatalog.updateMany({
    where: { templateKey: { in: ["template-1", "template-2", "template-3"] } },
    data: { status: "VISIBLE" },
  });
}

beforeEach(resetCatalog);
afterEach(resetCatalog);

describe("public template catalog", () => {
  it("uses database metadata and ordering with exact runtime presentation", async () => {
    const modern = await db.templateCategory.findUniqueOrThrow({ where: { key: "modern" } });
    await db.templateCatalog.update({
      where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
      data: {
        name: "Larasati Kurasi",
        description: "Deskripsi dari katalog database.",
        priceInRupiah: 825000,
        marketingThumbnail: "https://cdn.example/larasati.webp",
        displayOrder: 20,
        categoryId: modern.id,
      },
    });
    await db.templateCatalog.update({
      where: { templateKey_templateVersion: { templateKey: "template-2", templateVersion: 1 } },
      data: { displayOrder: 10 },
    });

    const templates = await getVisibleTemplateCatalog();
    const larasati = templates.find((template) => template.templateKey === "template-1");

    expect(templates.map((template) => template.templateKey)).toEqual([
      "template-2",
      "template-1",
      "template-3",
    ]);
    expect(larasati).toMatchObject({
      name: "Larasati Kurasi",
      category: "Modern",
      description: "Deskripsi dari katalog database.",
      priceInRupiah: 825000,
      marketingThumbnail: "https://cdn.example/larasati.webp",
      previewStyle: "arch",
    });
  });

  it("resolves aliases only while the catalog metadata remains visible", async () => {
    const catalog = await db.templateCatalog.findUniqueOrThrow({
      where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
      select: { id: true },
    });
    await db.templateSlugAlias.create({
      data: { slug: "larasati-lama", templateCatalogId: catalog.id, isCurrent: false },
    });

    await expect(resolveTemplateCatalogBySlug("larasati-lama")).resolves.toMatchObject({
      slug: "larasati",
      isVisible: true,
    });

    await db.templateCatalog.update({ where: { id: catalog.id }, data: { status: "HIDDEN" } });
    await expect(resolveTemplateCatalogBySlug("larasati-lama")).resolves.toMatchObject({
      ok: false,
      reason: "NOT_VISIBLE",
    });

    await db.templateCatalog.update({ where: { id: catalog.id }, data: { status: "RETIRED" } });
    await expect(resolveTemplateCatalogBySlug("larasati-lama")).resolves.toMatchObject({
      ok: false,
      reason: "NOT_VISIBLE",
    });
  });
});
