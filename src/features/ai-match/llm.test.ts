// src/features/ai-match/llm.test.ts
// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create } };
  },
}));

import { llmAvailable, parseWithLlm } from "./llm";

describe("llmAvailable", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  it("is false when no API key is configured", () => {
    delete process.env.OPENAI_API_KEY;
    expect(llmAvailable()).toBe(false);
  });

  it("is true when an API key is configured", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect(llmAvailable()).toBe(true);
  });
});

describe("parseWithLlm", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-test";
    create.mockReset();
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  it("returns null without calling OpenAI when no API key is set", async () => {
    delete process.env.OPENAI_API_KEY;
    const brief = await parseWithLlm("cerita apa saja");
    expect(brief).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("returns the parsed brief on a valid structured response", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ kategori: "modern", nuansa: "warm" }) } }],
    });

    const brief = await parseWithLlm("pernikahan modern di pantai saat senja");

    expect(brief).toEqual({ kategori: "modern", nuansa: "warm" });
  });

  it("returns null when the API call throws", async () => {
    create.mockRejectedValue(new Error("network down"));
    const brief = await parseWithLlm("cerita apa saja");
    expect(brief).toBeNull();
  });

  it("returns null when the response fails schema validation", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ kategori: "vintage", nuansa: null }) } }],
    });
    const brief = await parseWithLlm("cerita apa saja");
    expect(brief).toBeNull();
  });
});
