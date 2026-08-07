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

  it("rejects a request whose content-length exceeds the body size cap", async () => {
    parseWithLlm.mockResolvedValue(null);

    const cerita = "a".repeat(5_000);
    const response = await POST(
      new Request("https://undango.example/api/ai-match", {
        method: "POST",
        headers: { "content-length": String(cerita.length) },
        body: JSON.stringify({ cerita }),
      }),
    );

    expect(response.status).toBe(413);
  });

  it("truncates an overly long cerita instead of rejecting the request", async () => {
    parseWithLlm.mockResolvedValue(null);

    const cerita = "adat Jawa hangat ".repeat(150); // well over 2000 chars but under body cap headers omitted
    const response = await POST(
      new Request("https://undango.example/api/ai-match", {
        method: "POST",
        body: JSON.stringify({ cerita }),
      }),
    );

    expect(response.status).toBe(200);
  });

  it("rate limits rapid requests, returning 429 once the limit is exceeded", async () => {
    // The rate limiter is module-level state; reset the module registry so
    // this test starts from a fresh limiter unaffected by earlier tests in
    // this file, then re-import POST with the same mocks applied.
    vi.resetModules();
    const { POST: freshPost } = await import("./route");
    parseWithLlm.mockResolvedValue(null);

    const makeRequest = () =>
      freshPost(
        new Request("https://undango.example/api/ai-match", {
          method: "POST",
          body: JSON.stringify({ cerita: "Pernikahan adat Jawa yang hangat" }),
        }),
      );

    const responses = [];
    for (let i = 0; i < 11; i += 1) {
      responses.push(await makeRequest());
    }

    const statuses = responses.map((response) => response.status);
    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(200));
    expect(statuses[10]).toBe(429);
  });
});
