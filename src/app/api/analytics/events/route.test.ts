// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { create, resolveTemplate, listCategories } = vi.hoisted(() => ({
  create: vi.fn(),
  resolveTemplate: vi.fn(),
  listCategories: vi.fn(),
}));

vi.mock("@/lib/server/db", () => ({
  db: { analyticsEvent: { create } },
}));

vi.mock("@/features/templates/catalog", () => ({
  resolveTemplateCatalogByIdentity: resolveTemplate,
  listTemplateCategoryNames: listCategories,
}));

import { POST } from "./route";

describe("POST /api/analytics/events", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({});
    resolveTemplate.mockResolvedValue({
      templateKey: "template-1",
      templateVersion: 1,
      slug: "larasati",
      name: "Larasati",
      category: "Klasik",
      description: "Klasik Jawa",
      priceInRupiah: 650000,
      marketingThumbnail: null,
      displayOrder: 10,
      status: "VISIBLE",
      isVisible: true,
      contentSchemaVersion: 2,
      previewStyle: "arch",
      capabilities: [],
      palettes: [{ key: "gading", name: "Gading", tokens: {} }],
      demo: { paletteKey: "gading", content: {} },
    });
    listCategories.mockResolvedValue(["Klasik"]);
  });

  it("stores only derived allowlisted event fields", async () => {
    const response = await POST(
      new Request("https://undango.example/api/analytics/events", {
        method: "POST",
        body: JSON.stringify({
          name: "whatsapp_cta_clicked",
          properties: {
            templateKey: "template-1",
            templateVersion: 1,
            paletteKey: "gading",
          },
        }),
      }),
    );

    expect(response.status).toBe(204);
    expect(create).toHaveBeenCalledWith({
      data: {
        name: "whatsapp_cta_clicked",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "gading",
          priceInRupiah: 650000,
        },
      },
    });
  });

  it("rejects payloads containing non-allowlisted data", async () => {
    const response = await POST(
      new Request("https://undango.example/api/analytics/events", {
        method: "POST",
        body: JSON.stringify({
          name: "whatsapp_cta_clicked",
          properties: {
            templateKey: "template-1",
            templateVersion: 1,
            paletteKey: "gading",
            email: "visitor@example.com",
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
