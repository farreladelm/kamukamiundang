import { templateRegistry } from "./registry";
import {
  getCatalogBootstrap,
  templateCategoryBootstrap,
} from "./catalog-schema";

type CatalogTransaction = {
  templateCategory: {
    findUnique(args: { where: { key: string } }): Promise<{ id: string } | null>;
    create(args: { data: typeof templateCategoryBootstrap[number] }): Promise<unknown>;
  };
  templateCatalog: {
    findUnique(args: { where: Record<string, unknown> }): Promise<{ id: string } | null>;
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    findMany(args: { select: {
      id: true;
      templateKey: true;
      templateVersion: true;
      slug: true;
    } }): Promise<Array<{
      id: string;
      templateKey: string;
      templateVersion: number;
      slug: string;
    }>>;
  };
  templateSlugAlias: {
    findUnique(args: { where: { slug: string } }): Promise<{ templateCatalogId: string } | null>;
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
};

export type TemplateCatalogReconciliationReport = {
  createdCategoryRecords: number;
  createdCatalogRecords: number;
  createdAliasRecords: number;
  runtimeOnly: string[];
  metadataOnly: string[];
  conflicts: string[];
  hasDrift: boolean;
};

function runtimeIdentity(templateKey: string, templateVersion: number): string {
  return `${templateKey}:${templateVersion}`;
}

function fallbackCatalogMetadata(templateKey: string, templateVersion: number) {
  const slug = `${templateKey}-v${templateVersion}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    templateKey,
    templateVersion,
    slug,
    name: `${templateKey} v${templateVersion}`,
    categoryKey: "klasik",
    description: "Metadata katalog belum dilengkapi.",
    priceInRupiah: 0,
    marketingThumbnail: null,
    displayOrder: 0,
  };
}

export async function reconcileTemplateCatalogWithClient(
  db: CatalogTransaction,
): Promise<TemplateCatalogReconciliationReport> {
  const report = {
    createdCategoryRecords: 0,
    createdCatalogRecords: 0,
    createdAliasRecords: 0,
    runtimeOnly: [] as string[],
    metadataOnly: [] as string[],
    conflicts: [] as string[],
  };

  for (const category of templateCategoryBootstrap) {
    const existing = await db.templateCategory.findUnique({ where: { key: category.key } });
    if (existing) continue;

    await db.templateCategory.create({ data: category });
    report.createdCategoryRecords += 1;
  }

  const seenRuntime = new Set<string>();
  for (const runtime of templateRegistry) {
    const identity = runtimeIdentity(runtime.templateKey, runtime.templateVersion);
    if (seenRuntime.has(identity)) {
      report.conflicts.push(`duplicate-runtime:${identity}`);
      continue;
    }
    seenRuntime.add(identity);

    const existing = await db.templateCatalog.findUnique({
      where: {
        templateKey_templateVersion: {
          templateKey: runtime.templateKey,
          templateVersion: runtime.templateVersion,
        },
      },
    });
    if (existing) continue;

    const bootstrap = getCatalogBootstrap(runtime.templateKey, runtime.templateVersion)
      ?? fallbackCatalogMetadata(runtime.templateKey, runtime.templateVersion);
    const category = await db.templateCategory.findUnique({
      where: { key: bootstrap.categoryKey },
    });

    if (!category) {
      report.runtimeOnly.push(identity);
      report.conflicts.push(`missing-category:${bootstrap.categoryKey}`);
      continue;
    }

    const slugOwner = await db.templateCatalog.findUnique({ where: { slug: bootstrap.slug } });
    const aliasOwner = await db.templateSlugAlias.findUnique({ where: { slug: bootstrap.slug } });
    if (slugOwner || aliasOwner) {
      report.runtimeOnly.push(identity);
      report.conflicts.push(`duplicate-slug:${bootstrap.slug}`);
      continue;
    }

    const { categoryKey: _categoryKey, ...catalogData } = bootstrap;
    void _categoryKey;
    await db.templateCatalog.create({
      data: {
        ...catalogData,
        categoryId: category.id,
        status: "DRAFT",
      },
    });
    report.createdCatalogRecords += 1;
  }

  const catalogs = await db.templateCatalog.findMany({
    select: { id: true, templateKey: true, templateVersion: true, slug: true },
  });
  const runtimeIdentities = new Set(
    templateRegistry.map((runtime) => runtimeIdentity(runtime.templateKey, runtime.templateVersion)),
  );

  for (const catalog of catalogs) {
    const identity = runtimeIdentity(catalog.templateKey, catalog.templateVersion);
    if (!runtimeIdentities.has(identity)) report.metadataOnly.push(identity);

    const alias = await db.templateSlugAlias.findUnique({ where: { slug: catalog.slug } });
    if (alias) {
      if (alias.templateCatalogId !== catalog.id) {
        report.conflicts.push(`slug-alias-owner:${catalog.slug}`);
      }
      continue;
    }

    await db.templateSlugAlias.create({
      data: {
        slug: catalog.slug,
        templateCatalogId: catalog.id,
        isCurrent: true,
      },
    });
    report.createdAliasRecords += 1;
  }

  return {
    ...report,
    hasDrift: report.runtimeOnly.length > 0
      || report.metadataOnly.length > 0
      || report.conflicts.length > 0,
  };
}
