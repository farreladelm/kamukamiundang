import "server-only";

import { db } from "@/lib/server/db";
import { templateRegistry } from "./registry";
import type {
  TemplateCatalogItem,
  TemplateCatalogStatus,
  TemplateRuntimeManifest,
} from "./types";

export type TemplateCatalogDatabaseRecord = {
  id: string;
  templateKey: string;
  templateVersion: number;
  slug: string;
  name: string;
  description: string;
  priceInRupiah: number;
  marketingThumbnail: string | null;
  displayOrder: number;
  status: TemplateCatalogStatus;
  category: { key: string; name: string };
  slugAliases: Array<{ slug: string; isCurrent: boolean }>;
};

type ResolveOptions = {
  templateKey?: string;
  templateVersion?: number;
  expectedContentSchemaVersion?: number;
  paletteKey?: string;
  requireVisible?: boolean;
};

type RuntimeRegistry = readonly TemplateRuntimeManifest[];

export type UnavailableCatalog = {
  ok: false;
  reason: "MISSING_METADATA" | "MISSING_RUNTIME" | "NOT_VISIBLE" | "INCOMPATIBLE_RUNTIME";
  templateKey: string;
  templateVersion: number;
};

export type ResolvedTemplateCatalog = TemplateCatalogItem;

function identity(templateKey: string, templateVersion: number): string {
  return `${templateKey}:${templateVersion}`;
}

function unavailable(
  reason: UnavailableCatalog["reason"],
  templateKey: string,
  templateVersion: number,
): UnavailableCatalog {
  return { ok: false, reason, templateKey, templateVersion };
}

export function resolveTemplateCatalogRecord(
  record: TemplateCatalogDatabaseRecord | null,
  registry: RuntimeRegistry = templateRegistry,
  options: ResolveOptions = {},
): ResolvedTemplateCatalog | UnavailableCatalog {
  const templateKey = record?.templateKey ?? options.templateKey;
  const templateVersion = record?.templateVersion ?? options.templateVersion;

  if (!templateKey || templateVersion === undefined) {
    throw new Error("MISSING_METADATA: runtime identity is required");
  }

  if (!record) {
    return unavailable("MISSING_METADATA", templateKey, templateVersion);
  }

  const runtime = registry.find(
    (candidate) =>
      candidate.templateKey === record.templateKey &&
      candidate.templateVersion === record.templateVersion,
  );

  if (!runtime) {
    return unavailable("MISSING_RUNTIME", record.templateKey, record.templateVersion);
  }

  if (options.requireVisible && record.status !== "VISIBLE") {
    return unavailable("NOT_VISIBLE", record.templateKey, record.templateVersion);
  }

  if (
    options.expectedContentSchemaVersion !== undefined &&
    options.expectedContentSchemaVersion !== runtime.contentSchemaVersion
  ) {
    return unavailable("INCOMPATIBLE_RUNTIME", record.templateKey, record.templateVersion);
  }

  const palette = options.paletteKey
    ? runtime.palettes.find((candidate) => candidate.key === options.paletteKey)
    : undefined;
  if (options.paletteKey && !palette) {
    return unavailable("INCOMPATIBLE_RUNTIME", record.templateKey, record.templateVersion);
  }

  return {
    templateKey: record.templateKey,
    templateVersion: record.templateVersion,
    slug: record.slug,
    name: record.name,
    category: record.category.name,
    description: record.description,
    priceInRupiah: record.priceInRupiah,
    marketingThumbnail: record.marketingThumbnail,
    displayOrder: record.displayOrder,
    status: record.status,
    isVisible: record.status === "VISIBLE",
    contentSchemaVersion: runtime.contentSchemaVersion,
    previewStyle: runtime.previewStyle,
    capabilities: runtime.capabilities,
    palettes: runtime.palettes,
    demo: runtime.demo,
  };
}

type CatalogClient = {
  templateCatalog: {
    findMany(args: Record<string, unknown>): Promise<TemplateCatalogDatabaseRecord[]>;
    findFirst(args: Record<string, unknown>): Promise<TemplateCatalogDatabaseRecord | null>;
    findUnique(args: Record<string, unknown>): Promise<TemplateCatalogDatabaseRecord | null>;
  };
  templateCategory?: {
    findMany(args: Record<string, unknown>): Promise<Array<{ name: string }>>;
  };
};

const catalogSelect = {
  id: true,
  templateKey: true,
  templateVersion: true,
  slug: true,
  name: true,
  description: true,
  priceInRupiah: true,
  marketingThumbnail: true,
  displayOrder: true,
  status: true,
  category: { select: { key: true, name: true } },
  slugAliases: { select: { slug: true, isCurrent: true } },
} as const;

export async function listVisibleTemplateCatalogWithClient(
  client: CatalogClient,
): Promise<ResolvedTemplateCatalog[]> {
  const records = await client.templateCatalog.findMany({
    where: { status: "VISIBLE" },
    orderBy: [{ displayOrder: "asc" }, { templateKey: "asc" }, { templateVersion: "asc" }],
    select: catalogSelect,
  });

  return records.flatMap((record) => {
    const resolved = resolveTemplateCatalogRecord(record, templateRegistry, {
      requireVisible: true,
    });
    return "ok" in resolved ? [] : [resolved];
  });
}

export async function resolveTemplateCatalogBySlugWithClient(
  client: CatalogClient,
  slug: string,
): Promise<ResolvedTemplateCatalog | UnavailableCatalog> {
  const record = await client.templateCatalog.findFirst({
    where: {
      OR: [{ slug }, { slugAliases: { some: { slug } } }],
    },
    select: catalogSelect,
  });

  if (!record) {
    return unavailable("MISSING_METADATA", "unknown", 0);
  }

  return resolveTemplateCatalogRecord(record, templateRegistry, { requireVisible: true });
}

export async function resolveTemplateCatalogByIdentityWithClient(
  client: CatalogClient,
  templateKey: string,
  templateVersion: number,
  options: Omit<ResolveOptions, "templateKey" | "templateVersion"> = {},
): Promise<ResolvedTemplateCatalog | UnavailableCatalog> {
  const record = await client.templateCatalog.findUnique({
    where: { templateKey_templateVersion: { templateKey, templateVersion } },
    select: catalogSelect,
  });

  return resolveTemplateCatalogRecord(record, templateRegistry, {
    ...options,
    templateKey,
    templateVersion,
  });
}

export async function getVisibleTemplateCatalog(): Promise<ResolvedTemplateCatalog[]> {
  return listVisibleTemplateCatalogWithClient(db as unknown as CatalogClient);
}

export async function resolveTemplateCatalogBySlug(
  slug: string,
): Promise<ResolvedTemplateCatalog | UnavailableCatalog> {
  return resolveTemplateCatalogBySlugWithClient(db as unknown as CatalogClient, slug);
}

export async function resolveTemplateCatalogByIdentity(
  templateKey: string,
  templateVersion: number,
  options: Omit<ResolveOptions, "templateKey" | "templateVersion"> = {},
): Promise<ResolvedTemplateCatalog | UnavailableCatalog> {
  return resolveTemplateCatalogByIdentityWithClient(
    db as unknown as CatalogClient,
    templateKey,
    templateVersion,
    options,
  );
}

export async function listTemplateCategoryNamesWithClient(
  client: CatalogClient,
): Promise<string[]> {
  const categories = await client.templateCategory?.findMany({
    where: { isActive: true },
    select: { name: true },
    orderBy: { displayOrder: "asc" },
  });
  return categories?.map((category) => category.name) ?? [];
}

export async function listTemplateCategoryNames(): Promise<string[]> {
  return listTemplateCategoryNamesWithClient(db as unknown as CatalogClient);
}

export type TemplateRuntimeReference = {
  source: "order" | "invitation" | "publishedSnapshot";
  id: string;
  templateKey: string;
  templateVersion: number;
  contentSchemaVersion: number;
  paletteKey: string;
};

export type RuntimeReferenceContract = {
  templateKey: string;
  templateVersion: number;
  contentSchemaVersion: number;
  paletteKeys: readonly string[];
};

export function findTemplateRuntimeReferenceDrift(
  references: readonly TemplateRuntimeReference[],
  runtimes: readonly RuntimeReferenceContract[],
): string[] {
  const runtimeMap = new Map(
    runtimes.map((runtime) => [identity(runtime.templateKey, runtime.templateVersion), runtime]),
  );
  const drift: string[] = [];

  for (const reference of references) {
    const runtime = runtimeMap.get(identity(reference.templateKey, reference.templateVersion));
    if (!runtime) {
      drift.push(
        `missing:${reference.source}:${reference.id}:${identity(reference.templateKey, reference.templateVersion)}`,
      );
      continue;
    }

    if (
      runtime.contentSchemaVersion !== reference.contentSchemaVersion ||
      !runtime.paletteKeys.includes(reference.paletteKey)
    ) {
      const mismatch = runtime.contentSchemaVersion !== reference.contentSchemaVersion
        ? "schema"
        : "palette";
      drift.push(
        `incompatible:${reference.source}:${reference.id}:${identity(reference.templateKey, reference.templateVersion)}:${mismatch}`,
      );
    }
  }

  return drift;
}

export function getRuntimeReferenceContracts(): RuntimeReferenceContract[] {
  return templateRegistry.map((runtime) => ({
    templateKey: runtime.templateKey,
    templateVersion: runtime.templateVersion,
    contentSchemaVersion: runtime.contentSchemaVersion,
    paletteKeys: runtime.palettes.map((palette) => palette.key),
  }));
}
