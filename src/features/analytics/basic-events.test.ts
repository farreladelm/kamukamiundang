// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  createBasicEventRateLimiter,
  parseBasicShowroomEvent,
} from "./basic-events";

describe("parseBasicShowroomEvent", () => {
  it("accepts only allowlisted registry-backed properties and derives current price", () => {
    expect(
      parseBasicShowroomEvent({
        name: "whatsapp_cta_clicked",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "gading",
        },
      }),
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

  it("rejects unexpected properties and values outside visible template registry", () => {
    expect(
      parseBasicShowroomEvent({
        name: "whatsapp_cta_clicked",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "gading",
          email: "visitor@example.com",
        },
      }),
    ).toBeNull();
    expect(
      parseBasicShowroomEvent({
        name: "template_palette_selected",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "unknown",
        },
      }),
    ).toBeNull();
  });

  it("derives detail category without accepting a client-supplied palette", () => {
    expect(
      parseBasicShowroomEvent({
        name: "template_detail_viewed",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
        },
      }),
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
