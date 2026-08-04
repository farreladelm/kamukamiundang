// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  createBasicEventRateLimiter,
  parseBasicShowroomEvent,
} from "./basic-events";
import { templateRegistry } from "@/features/templates/registry";
import type { EventDependencies } from "./basic-events";

const runtime = templateRegistry[0];
const resolvedTemplate = {
  templateKey: runtime.templateKey,
  templateVersion: runtime.templateVersion,
  slug: "larasati",
  name: "Larasati",
  category: "Klasik",
  description: "Klasik Jawa",
  priceInRupiah: 650000,
  marketingThumbnail: null,
  displayOrder: 10,
  status: "VISIBLE" as const,
  isVisible: true,
  contentSchemaVersion: runtime.contentSchemaVersion,
  previewStyle: runtime.previewStyle,
  capabilities: runtime.capabilities,
  palettes: runtime.palettes,
  demo: runtime.demo,
};
const dependencies: EventDependencies = {
  resolveTemplate: async (_templateKey, _templateVersion, options) => {
    if (options?.paletteKey === "unknown") {
      return {
        ok: false,
        reason: "INCOMPATIBLE_RUNTIME" as const,
        templateKey: runtime.templateKey,
        templateVersion: runtime.templateVersion,
      };
    }
    return resolvedTemplate;
  },
  listCategories: async () => ["Klasik"],
};

describe("parseBasicShowroomEvent", () => {
  it("accepts only allowlisted catalog-backed properties and derives current price", async () => {
    expect(
      await parseBasicShowroomEvent({
        name: "whatsapp_cta_clicked",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "gading",
        },
      }, dependencies),
    ).toEqual({
      name: "whatsapp_cta_clicked",
      properties: {
        templateKey: "template-1",
        templateVersion: 1,
        paletteKey: "gading",
        priceInRupiah: 650000,
      },
    });
  });

  it("rejects unexpected properties and values outside visible catalog", async () => {
    expect(
      parseBasicShowroomEvent({
        name: "whatsapp_cta_clicked",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "gading",
          email: "visitor@example.com",
        },
      }, dependencies),
    ).resolves.toBeNull();
    expect(
      parseBasicShowroomEvent({
        name: "template_palette_selected",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "unknown",
        },
      }, dependencies),
    ).resolves.toBeNull();
  });

  it("derives detail category without accepting a client-supplied palette", async () => {
    expect(
      await parseBasicShowroomEvent({
        name: "template_detail_viewed",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
        },
      }, dependencies),
    ).toEqual({
      name: "template_detail_viewed",
      properties: {
        templateKey: "template-1",
        templateVersion: 1,
        category: "Klasik",
      },
    });
  });
});

describe("createBasicEventRateLimiter", () => {
  it("allows a bounded number of writes per window", () => {
    const limiter = createBasicEventRateLimiter({ max: 2, windowMs: 1_000 });

    expect(limiter.allow(10)).toBe(true);
    expect(limiter.allow(11)).toBe(true);
    expect(limiter.allow(12)).toBe(false);
    expect(limiter.allow(1_010)).toBe(true);
  });
});
