import "server-only";

import { db } from "@/lib/server/db";
import { getTemplateDefinition, templateRegistry } from "./registry";
import type { TemplateCatalogItem } from "./types";

export function assertTemplateVersionExists(templateKey: string, templateVersion: number): void {
  if (!getTemplateDefinition(templateKey, templateVersion)) {
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

  return db.templateVisibility.upsert({
    where: { templateKey_templateVersion: { templateKey, templateVersion } },
    create: { templateKey, templateVersion, isVisible, updatedByAdminId: adminId },
    update: { isVisible, updatedByAdminId: adminId },
    select: { templateKey: true, templateVersion: true, isVisible: true },
  });
}

export async function getVisibleTemplateCatalogFromDatabase(): Promise<TemplateCatalogItem[]> {
  const overrides = await db.templateVisibility.findMany({
    select: { templateKey: true, templateVersion: true, isVisible: true },
  });
  const overrideMap = new Map(
    overrides.map((override) => [
      `${override.templateKey}:${override.templateVersion}`,
      override.isVisible,
    ]),
  );

  const sourceCatalog = templateRegistry.map((template) => ({
    templateKey: template.templateKey,
    templateVersion: template.templateVersion,
    slug: template.slug,
    name: template.name,
    category: template.category,
    description: template.description,
    priceInRupiah: template.priceInRupiah,
    previewStyle: template.previewStyle,
    isVisible: template.isVisible,
    palettes: template.palettes,
  }));

  return sourceCatalog.filter((template) => {
    const key = `${template.templateKey}:${template.templateVersion}`;
    return overrideMap.get(key) ?? template.isVisible;
  });
}

export async function listTemplateVisibility() {
  const overrides = await db.templateVisibility.findMany({
    select: { templateKey: true, templateVersion: true, isVisible: true },
  });
  const overrideMap = new Map(
    overrides.map((override) => [
      `${override.templateKey}:${override.templateVersion}`,
      override.isVisible,
    ]),
  );

  return templateRegistry.map((template) => ({
    templateKey: template.templateKey,
    templateVersion: template.templateVersion,
    name: template.name,
    category: template.category,
    priceInRupiah: template.priceInRupiah,
    isVisible: overrideMap.get(`${template.templateKey}:${template.templateVersion}`) ?? template.isVisible,
  }));
}
