// src/app/api/ai-match/route.test.ts
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseWithLlm, getVisibleTemplateCatalogFromDatabase } = vi.hoisted(() => ({
  parseWithLlm: vi.fn(),
  getVisibleTemplateCatalogFromDatabase: vi.fn(),
}));

vi.mock("@/features/ai-match/llm", () => ({ parseWithLlm }));
vi.mock("@/features/templates/visibility", () => ({ getVisibleTemplateCatalogFromDatabase }));

import { POST } from "./route";

const templates = [
  {
    templateKey: "template-1",
    templateVersion: 1,
    slug: "larasati",
    name: "Larasati",
    category: "Klasik",
    description: "",
    priceInRupiah: 650000,
    marketingThumbnail: null,
    displayOrder: 10,
    status: "VISIBLE",
    isVisible: true,
    contentSchemaVersion: 2,
    previewStyle: "arch",
    capabilities: [],
    palettes: [
      { key: "gading", name: "Gading", tokens: {} },
      { key: "soga", name: "Soga", tokens: {} },
      { key: "malam", name: "Malam", tokens: {} },
    ],
    demo: { paletteKey: "gading", content: {} },
  },
];

describe("POST /api/ai-match", () => {
  beforeEach(() => {
    parseWithLlm.mockReset();
    getVisibleTemplateCatalogFromDatabase.mockReset();
    getVisibleTemplateCatalogFromDatabase.mockResolvedValue(templates);
  });

  it("rejects an empty cerita", async () => {
    const response = await POST(
      new Request("https://undango.example/api/ai-match", {
        method: "POST",
        body: JSON.stringify({ cerita: "  " }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects a JSON body that parses successfully but isn't an object", async () => {
    const response = await POST(
      new Request("https://undango.example/api/ai-match", {
        method: "POST",
        body: JSON.stringify(null),
      }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(typeof body.pesan).toBe("string");
  });

  it("uses the LLM brief and reports source llm when parsing succeeds", async () => {
    parseWithLlm.mockResolvedValue({ kategori: "klasik", nuansa: "warm" });

    const response = await POST(
      new Request("https://undango.example/api/ai-match", {
        method: "POST",
        body: JSON.stringify({ cerita: "Pernikahan adat Jawa" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("llm");
    expect(body.results[0]).toMatchObject({ templateKey: "template-1", paletteKey: "soga" });
  });

  it("falls back to keyword matching and reports source fallback when the LLM is unavailable", async () => {
    parseWithLlm.mockResolvedValue(null);

    const response = await POST(
      new Request("https://undango.example/api/ai-match", {
        method: "POST",
        body: JSON.stringify({ cerita: "Pernikahan adat Jawa yang hangat" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(body.results[0]).toMatchObject({ templateKey: "template-1", paletteKey: "soga" });
  });
});
