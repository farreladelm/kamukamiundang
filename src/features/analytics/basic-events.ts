import "server-only";

import { getTemplateDefinition, templateRegistry } from "@/features/templates/registry";

const listCategories = new Set([
  "Semua",
  ...templateRegistry.map((template) => template.category),
]);

type BasicShowroomEvent =
  | {
      name: "template_list_viewed";
      properties: { category: string };
    }
  | {
      name: "template_detail_viewed";
      properties: { templateKey: string; templateVersion: number; category: string };
    }
  | {
      name: "template_palette_selected";
      properties: { templateKey: string; templateVersion: number; paletteKey: string };
    }
  | {
      name: "whatsapp_cta_clicked";
      properties: {
        templateKey: string;
        templateVersion: number;
        paletteKey: string;
        priceInRupiah: number;
      };
    };

type RateLimiter = {
  allow: (now: number) => boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(record: Record<string, unknown>, keys: readonly string[]): boolean {
  const recordKeys = Object.keys(record);

  return recordKeys.length === keys.length && recordKeys.every((key) => keys.includes(key));
}

function parseTemplatePalette(properties: Record<string, unknown>) {
  if (
    !hasExactKeys(properties, ["templateKey", "templateVersion", "paletteKey"]) ||
    typeof properties.templateKey !== "string" ||
    typeof properties.templateVersion !== "number" ||
    !Number.isSafeInteger(properties.templateVersion) ||
    typeof properties.paletteKey !== "string"
  ) {
    return null;
  }

  const template = getTemplateDefinition(
    properties.templateKey,
    properties.templateVersion,
  );

  if (!template?.isVisible || !template.palettes.some((palette) => palette.key === properties.paletteKey)) {
    return null;
  }

  return { template, paletteKey: properties.paletteKey };
}

function parseTemplate(properties: Record<string, unknown>) {
  if (
    !hasExactKeys(properties, ["templateKey", "templateVersion"]) ||
    typeof properties.templateKey !== "string" ||
    typeof properties.templateVersion !== "number" ||
    !Number.isSafeInteger(properties.templateVersion)
  ) {
    return null;
  }

  const template = getTemplateDefinition(
    properties.templateKey,
    properties.templateVersion,
  );

  return template?.isVisible ? template : null;
}

export function parseBasicShowroomEvent(input: unknown): BasicShowroomEvent | null {
  if (!isRecord(input) || !hasExactKeys(input, ["name", "properties"]) || !isRecord(input.properties)) {
    return null;
  }

  if (input.name === "template_list_viewed") {
    if (
      !hasExactKeys(input.properties, ["category"]) ||
      typeof input.properties.category !== "string" ||
      !listCategories.has(input.properties.category)
    ) {
      return null;
    }

    return { name: input.name, properties: { category: input.properties.category } };
  }

  if (input.name === "template_detail_viewed") {
    const template = parseTemplate(input.properties);

    if (!template) {
      return null;
    }

    return {
      name: input.name,
      properties: {
        templateKey: template.templateKey,
        templateVersion: template.templateVersion,
        category: template.category,
      },
    };
  }

  const templatePalette = parseTemplatePalette(input.properties);

  if (!templatePalette) {
    return null;
  }

  if (input.name === "template_palette_selected") {
    return {
      name: input.name,
      properties: {
        templateKey: templatePalette.template.templateKey,
        templateVersion: templatePalette.template.templateVersion,
        paletteKey: templatePalette.paletteKey,
      },
    };
  }

  if (input.name === "whatsapp_cta_clicked") {
    return {
      name: input.name,
      properties: {
        templateKey: templatePalette.template.templateKey,
        templateVersion: templatePalette.template.templateVersion,
        paletteKey: templatePalette.paletteKey,
        priceInRupiah: templatePalette.template.priceInRupiah,
      },
    };
  }

  return null;
}

export function createBasicEventRateLimiter({
  max,
  windowMs,
}: {
  max: number;
  windowMs: number;
}): RateLimiter {
  let timestamps: number[] = [];

  return {
    allow(now: number): boolean {
      timestamps = timestamps.filter((timestamp) => now - timestamp < windowMs);

      if (timestamps.length >= max) {
        return false;
      }

      timestamps.push(now);
      return true;
    },
  };
}

const eventRateLimiter = createBasicEventRateLimiter({ max: 60, windowMs: 60_000 });

export function allowBasicShowroomEvent(now = Date.now()): boolean {
  return eventRateLimiter.allow(now);
}

export async function recordBasicShowroomEvent(event: BasicShowroomEvent): Promise<void> {
  const { db } = await import("@/lib/server/db");

  await db.analyticsEvent.create({ data: event });
}
