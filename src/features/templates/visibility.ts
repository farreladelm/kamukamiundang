import "server-only";

import { db } from "@/lib/server/db";
import {
  getVisibleTemplateCatalog,
  resolveTemplateCatalogRecord,
} from "./catalog";
import { getTemplateRuntimeManifest } from "./registry";
import type { TemplateCatalogItem } from "./types";

export function assertTemplateVersionExists(templateKey: string, templateVersion: number): void {
  if (!getTemplateRuntimeManifest(templateKey, templateVersion)) {
    throw new Error("Unknown template version");
  }
}

export async function setTemplateVisibility({
  templateKey,
  templateVersion,
  isVisible,
  adminId,
}: {
  templateKey: string;
  templateVersion: number;
  isVisible: boolean;
  adminId: string;
}) {
  assertTemplateVersionExists(templateKey, templateVersion);

  const catalog = await db.templateCatalog.findUnique({
    where: { templateKey_templateVersion: { templateKey, templateVersion } },
    select: { id: true, status: true },
  });

  if (!catalog) throw new Error("Template catalog metadata not found");
  if (catalog.status === "RETIRED") throw new Error("Retired template cannot change visibility");

  return db.templateCatalog.update({
    where: { id: catalog.id },
    data: { status: isVisible ? "VISIBLE" : "HIDDEN", updatedByAdminId: adminId },
    select: { templateKey: true, templateVersion: true, status: true },
  });
}

export async function getVisibleTemplateCatalogFromDatabase(): Promise<TemplateCatalogItem[]> {
  return getVisibleTemplateCatalog();
}

export async function listTemplateVisibility() {
  const records = await db.templateCatalog.findMany({
    orderBy: [{ displayOrder: "asc" }, { templateKey: "asc" }, { templateVersion: "asc" }],
    select: {
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
    },
  });

  return records.flatMap((record) => {
    const resolved = resolveTemplateCatalogRecord(record);
    return "ok" in resolved ? [] : [resolved];
  });
}
