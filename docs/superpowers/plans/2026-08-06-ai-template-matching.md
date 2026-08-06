# AI Template Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "ceritakan pernikahanmu" free-text box to the kamukamiundang showroom that recommends one of the 3 existing templates + one of its 3 existing palettes, reusing an LLM-parse-with-keyword-fallback architecture adapted from undangan-digital.

**Architecture:** New `src/features/ai-match/` module (zod brief schema, static tag data, gpt-4o-mini parser, keyword-only fallback parser, pure scoring function) behind one API route (`POST /api/ai-match`). A new client component `AiMatchBox` collects the story and a `ShowroomExperience` wrapper lifts the match result into the existing `Catalog` component via a new optional `matchResults` prop.

**Tech Stack:** Next.js App Router (existing), Zod v4 (existing), `openai` SDK v7 (new dependency, mirrors `undangan-digital`'s usage), Vitest + Testing Library (existing).

## Global Constraints

- Follow kamukamiundang's existing convention: English file/function/type names, Indonesian **only** in UI copy and API error messages (`pesan` field) — do not use undangan-digital's Indonesian-named-file style.
- No dynamic color engine, no content prefill (names/date/venue) — out of scope per the approved spec (`docs/superpowers/specs/2026-08-06-ai-template-matching-design.md`).
- Every template always appears in match results (score 0 included); never drop a template from the response.
- The API route must always return `200` for a well-formed request, even when the LLM fails — `source: "fallback"` signals degraded mode, never an HTTP error.
- Test runner in this environment: `pnpm` is not on `PATH` directly. Use `corepack pnpm <script>` for package scripts (e.g. `corepack pnpm test`, `corepack pnpm add openai`) and `npx vitest run <path> --no-file-parallelism` to run a single test file, run from `D:\Claude\kamukamiundang`.
- A pre-existing, unrelated failing test exists in `src/features/showroom/catalog.test.tsx` (`"Lihat preview Larasati"` / `"Pesan via WhatsApp"` aria-label assertions that don't match current markup). It predates this feature — do not fix it as part of this plan, and do not let it block: run new/modified tests by exact file+name, not blind pass/fail on the whole suite.
- Do not push to GitHub. Run everything on `localhost` and get explicit confirmation the feature works before any push — this was the user's explicit instruction.

---

### Task 1: Match brief schema

**Files:**
- Create: `src/features/ai-match/schema.ts`
- Test: `src/features/ai-match/schema.test.ts`

**Interfaces:**
- Produces: `kategoriSchema`, `nuansaSchema`, `matchBriefSchema` (Zod schemas); `type Kategori = "klasik" | "modern" | "botanical"`; `type Nuansa = "muted" | "warm" | "bold"`; `type MatchBrief = { kategori: Kategori | null; nuansa: Nuansa | null }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/ai-match/schema.test.ts
import { describe, expect, it } from "vitest";
import { matchBriefSchema } from "./schema";

describe("matchBriefSchema", () => {
  it("accepts a fully populated brief", () => {
    const result = matchBriefSchema.safeParse({ kategori: "klasik", nuansa: "warm" });
    expect(result.success).toBe(true);
  });

  it("accepts null fields", () => {
    const result = matchBriefSchema.safeParse({ kategori: null, nuansa: null });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown kategori value", () => {
    const result = matchBriefSchema.safeParse({ kategori: "vintage", nuansa: null });
    expect(result.success).toBe(false);
  });

  it("rejects a missing nuansa field", () => {
    const result = matchBriefSchema.safeParse({ kategori: null });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-match/schema.test.ts --no-file-parallelism`
Expected: FAIL — `Cannot find module './schema'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/ai-match/schema.ts
import { z } from "zod";

export const kategoriSchema = z.enum(["klasik", "modern", "botanical"]);
export const nuansaSchema = z.enum(["muted", "warm", "bold"]);

export const matchBriefSchema = z.object({
  kategori: kategoriSchema.nullable(),
  nuansa: nuansaSchema.nullable(),
});

export type Kategori = z.infer<typeof kategoriSchema>;
export type Nuansa = z.infer<typeof nuansaSchema>;
export type MatchBrief = z.infer<typeof matchBriefSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-match/schema.test.ts --no-file-parallelism`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-match/schema.ts src/features/ai-match/schema.test.ts
git commit -m "feat(ai-match): add match brief schema"
```

---

### Task 2: Keyword tags and rule-based fallback parser

**Files:**
- Create: `src/features/ai-match/tags.ts`
- Create: `src/features/ai-match/rule-fallback.ts`
- Test: `src/features/ai-match/rule-fallback.test.ts`

**Interfaces:**
- Consumes: `Kategori`, `Nuansa`, `MatchBrief` from `./schema` (Task 1).
- Produces: `KATEGORI_KEYWORDS: Record<Kategori, readonly string[]>`, `NUANSA_KEYWORDS: Record<Nuansa, readonly string[]>`, `PALETTE_INDEX_BY_NUANSA: Record<Nuansa, number>` from `./tags`; `parseFallback(cerita: string): MatchBrief` from `./rule-fallback`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/ai-match/rule-fallback.test.ts
import { describe, expect, it } from "vitest";
import { parseFallback } from "./rule-fallback";

describe("parseFallback", () => {
  it("detects kategori klasik and nuansa warm from Javanese wedding text", () => {
    expect(parseFallback("Pernikahan adat Jawa yang hangat di Yogyakarta")).toEqual({
      kategori: "klasik",
      nuansa: "warm",
    });
  });

  it("detects kategori modern and nuansa warm from beach/sunset keywords", () => {
    expect(parseFallback("Resepsi outdoor di pinggir pantai saat senja")).toEqual({
      kategori: "modern",
      nuansa: "warm",
    });
  });

  it("detects kategori botanical and nuansa bold from garden/dark text", () => {
    expect(parseFallback("Pesta taman yang gelap dan dramatis di malam hari")).toEqual({
      kategori: "botanical",
      nuansa: "bold",
    });
  });

  it("returns nulls when no keyword matches", () => {
    expect(parseFallback("Kami menikah bulan depan")).toEqual({
      kategori: null,
      nuansa: null,
    });
  });

  it("is case-insensitive", () => {
    expect(parseFallback("PERNIKAHAN ADAT JAWA")).toEqual({
      kategori: "klasik",
      nuansa: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-match/rule-fallback.test.ts --no-file-parallelism`
Expected: FAIL — `Cannot find module './rule-fallback'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/ai-match/tags.ts
import type { Kategori, Nuansa } from "./schema";

export const KATEGORI_KEYWORDS: Record<Kategori, readonly string[]> = {
  klasik: ["jawa", "klasik", "adat", "tradisional", "elegan", "formal", "kraton"],
  modern: ["modern", "pantai", "pesisir", "senja", "sunset", "minimalis", "outdoor"],
  botanical: ["botanical", "taman", "garden", "bunga", "alam", "kontemporer", "intim", "rustic"],
};

export const NUANSA_KEYWORDS: Record<Nuansa, readonly string[]> = {
  muted: ["pastel", "lembut", "cerah", "netral", "kalem"],
  warm: ["hangat", "sunset", "senja", "earthy", "keemasan", "terakota"],
  bold: ["gelap", "malam", "dramatis", "kontras", "hitam"],
};

export const PALETTE_INDEX_BY_NUANSA: Record<Nuansa, number> = {
  muted: 0,
  warm: 1,
  bold: 2,
};
```

```ts
// src/features/ai-match/rule-fallback.ts
import type { Kategori, MatchBrief, Nuansa } from "./schema";
import { KATEGORI_KEYWORDS, NUANSA_KEYWORDS } from "./tags";

function pickFirstMatch<T extends string>(text: string, table: Record<T, readonly string[]>): T | null {
  for (const key of Object.keys(table) as T[]) {
    if (table[key].some((keyword) => text.includes(keyword))) {
      return key;
    }
  }
  return null;
}

export function parseFallback(cerita: string): MatchBrief {
  const text = cerita.toLowerCase();
  return {
    kategori: pickFirstMatch<Kategori>(text, KATEGORI_KEYWORDS),
    nuansa: pickFirstMatch<Nuansa>(text, NUANSA_KEYWORDS),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-match/rule-fallback.test.ts --no-file-parallelism`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-match/tags.ts src/features/ai-match/rule-fallback.ts src/features/ai-match/rule-fallback.test.ts
git commit -m "feat(ai-match): add keyword tags and rule-based fallback parser"
```

---

### Task 3: Template scoring

**Files:**
- Create: `src/features/ai-match/match.ts`
- Test: `src/features/ai-match/match.test.ts`

**Interfaces:**
- Consumes: `MatchBrief` from `./schema` (Task 1); `PALETTE_INDEX_BY_NUANSA` from `./tags` (Task 2); `TemplateCatalogItem` from `@/features/templates/types` (existing).
- Produces: `type MatchResult = { templateKey: string; templateVersion: number; slug: string; score: number; reasons: string[]; paletteKey: string }`; `matchTemplates(brief: MatchBrief, templates: readonly TemplateCatalogItem[]): MatchResult[]`.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/ai-match/match.test.ts
import { describe, expect, it } from "vitest";
import { matchTemplates } from "./match";
import type { TemplateCatalogItem } from "@/features/templates/types";

function makeTemplate(overrides: Partial<TemplateCatalogItem>): TemplateCatalogItem {
  return {
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
      { key: "gading", name: "Gading", tokens: { canvas: "", surface: "", ink: "", muted: "", accent: "", line: "" } },
      { key: "soga", name: "Soga", tokens: { canvas: "", surface: "", ink: "", muted: "", accent: "", line: "" } },
      { key: "malam", name: "Malam", tokens: { canvas: "", surface: "", ink: "", muted: "", accent: "", line: "" } },
    ],
    demo: { paletteKey: "gading", content: {} as TemplateCatalogItem["demo"]["content"] },
    ...overrides,
  };
}

const templates: TemplateCatalogItem[] = [
  makeTemplate({ templateKey: "template-1", slug: "larasati", category: "Klasik", displayOrder: 10 }),
  makeTemplate({ templateKey: "template-2", slug: "pesisir-senja", category: "Modern", displayOrder: 20 }),
  makeTemplate({ templateKey: "template-3", slug: "taman-aksara", category: "Botanical", displayOrder: 30 }),
];

describe("matchTemplates", () => {
  it("always returns every template, even with an empty brief", () => {
    const results = matchTemplates({ kategori: null, nuansa: null }, templates);
    expect(results).toHaveLength(3);
    expect(results.every((result) => result.score === 0)).toBe(true);
  });

  it("preserves catalog order when scores tie", () => {
    const results = matchTemplates({ kategori: null, nuansa: null }, templates);
    expect(results.map((result) => result.templateKey)).toEqual(["template-1", "template-2", "template-3"]);
  });

  it("ranks the matching category first and explains why", () => {
    const results = matchTemplates({ kategori: "botanical", nuansa: null }, templates);
    expect(results[0].templateKey).toBe("template-3");
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].reasons).toContain('cocok dengan kategori "botanical"');
    expect(results[1].score).toBe(0);
    expect(results[2].score).toBe(0);
  });

  it("maps nuansa to the matching palette index", () => {
    const results = matchTemplates({ kategori: null, nuansa: "bold" }, templates);
    const larasati = results.find((result) => result.templateKey === "template-1");
    expect(larasati?.paletteKey).toBe("malam");
  });

  it("defaults to the first palette when nuansa is null", () => {
    const results = matchTemplates({ kategori: null, nuansa: null }, templates);
    const larasati = results.find((result) => result.templateKey === "template-1");
    expect(larasati?.paletteKey).toBe("gading");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/ai-match/match.test.ts --no-file-parallelism`
Expected: FAIL — `Cannot find module './match'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/ai-match/match.ts
import type { TemplateCatalogItem } from "@/features/templates/types";
import type { MatchBrief } from "./schema";
import { PALETTE_INDEX_BY_NUANSA } from "./tags";

export type MatchResult = {
  templateKey: string;
  templateVersion: number;
  slug: string;
  score: number;
  reasons: string[];
  paletteKey: string;
};

const KATEGORI_SCORE = 3;

export function matchTemplates(
  brief: MatchBrief,
  templates: readonly TemplateCatalogItem[],
): MatchResult[] {
  return templates
    .map((template): MatchResult => {
      const reasons: string[] = [];
      let score = 0;

      if (brief.kategori && template.category.toLowerCase() === brief.kategori) {
        score += KATEGORI_SCORE;
        reasons.push(`cocok dengan kategori "${brief.kategori}"`);
      }

      const paletteIndex = brief.nuansa ? PALETTE_INDEX_BY_NUANSA[brief.nuansa] : 0;
      const paletteKey = template.palettes[paletteIndex]?.key ?? template.palettes[0].key;

      return {
        templateKey: template.templateKey,
        templateVersion: template.templateVersion,
        slug: template.slug,
        score,
        reasons,
        paletteKey,
      };
    })
    .sort((a, b) => b.score - a.score);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/ai-match/match.test.ts --no-file-parallelism`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/ai-match/match.ts src/features/ai-match/match.test.ts
git commit -m "feat(ai-match): add pure template scoring function"
```

---

### Task 4: LLM brief parser

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (add `openai` dependency)
- Modify: `.env` (add `OPENAI_API_KEY`)
- Create: `src/features/ai-match/llm.ts`
- Test: `src/features/ai-match/llm.test.ts`

**Interfaces:**
- Consumes: `matchBriefSchema`, `MatchBrief` from `./schema` (Task 1).
- Produces: `llmAvailable(): boolean`; `parseWithLlm(cerita: string): Promise<MatchBrief | null>`.

- [ ] **Step 1: Install the `openai` dependency**

Run: `corepack pnpm add openai` (from `D:\Claude\kamukamiundang`)
Expected: `package.json` gains `"openai": "^7.x.x"` under `dependencies`, `pnpm-lock.yaml` updates.

- [ ] **Step 2: Add the API key to `.env`**

Edit `D:\Claude\kamukamiundang\.env`, appending:

```
OPENAI_API_KEY="OPENAI_API_KEY_REDACTED"
```

(Same key already used for local testing in `undangan-digital/.env.local`, per the user's explicit approval.)

- [ ] **Step 3: Write the failing test**

```ts
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/features/ai-match/llm.test.ts --no-file-parallelism`
Expected: FAIL — `Cannot find module './llm'`.

- [ ] **Step 5: Write minimal implementation**

```ts
// src/features/ai-match/llm.ts
import "server-only";
import OpenAI from "openai";
import { matchBriefSchema, type MatchBrief } from "./schema";

const MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 20_000;
const TEMPERATURE = 0;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kategori", "nuansa"],
  properties: {
    kategori: { type: ["string", "null"], enum: ["klasik", "modern", "botanical", null] },
    nuansa: { type: ["string", "null"], enum: ["muted", "warm", "bold", null] },
  },
} as const;

const INSTRUCTIONS = [
  "Kamu membaca cerita bebas calon pengantin Indonesia dan menentukan dua hal saja:",
  '1. `kategori`: satu dari "klasik" (adat/tradisional/Jawa), "modern" (minimalis/pantai/outdoor), "botanical" (taman/bunga/alam), atau null kalau tidak jelas.',
  '2. `nuansa`: satu dari "muted" (lembut/pastel/netral), "warm" (hangat/senja/keemasan), "bold" (gelap/dramatis), atau null kalau tidak jelas.',
  "JANGAN mengarang kategori atau nuansa yang tidak tersirat dari teks. Kalau ragu, isi null.",
].join("\n");

export function llmAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function parseWithLlm(cerita: string): Promise<MatchBrief | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create(
      {
        model: MODEL,
        temperature: TEMPERATURE,
        messages: [
          { role: "system", content: INSTRUCTIONS },
          { role: "user", content: cerita },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "match_brief", strict: true, schema: RESPONSE_SCHEMA },
        },
      },
      { timeout: TIMEOUT_MS },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = matchBriefSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch (err) {
    console.error("[ai-match] LLM gagal, beralih ke pencocokan kata kunci:", err);
    return null;
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/features/ai-match/llm.test.ts --no-file-parallelism`
Expected: PASS (6 tests)

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml .env src/features/ai-match/llm.ts src/features/ai-match/llm.test.ts
git commit -m "feat(ai-match): add gpt-4o-mini brief parser with graceful fallback"
```

---

### Task 5: API route

**Files:**
- Create: `src/app/api/ai-match/route.ts`
- Test: `src/app/api/ai-match/route.test.ts`

**Interfaces:**
- Consumes: `parseWithLlm` from `@/features/ai-match/llm` (Task 4); `parseFallback` from `@/features/ai-match/rule-fallback` (Task 2); `matchTemplates` from `@/features/ai-match/match` (Task 3); `getVisibleTemplateCatalogFromDatabase` from `@/features/templates/visibility` (existing).
- Produces: `POST(request: Request): Promise<Response>` returning JSON `{ source: "llm" | "fallback"; results: MatchResult[] }` on success, `{ pesan: string }` with 400 on a malformed/empty request.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/ai-match/route.test.ts --no-file-parallelism`
Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/api/ai-match/route.ts
import { parseWithLlm } from "@/features/ai-match/llm";
import { matchTemplates } from "@/features/ai-match/match";
import { parseFallback } from "@/features/ai-match/rule-fallback";
import { getVisibleTemplateCatalogFromDatabase } from "@/features/templates/visibility";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: { cerita?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return Response.json({ pesan: "Body bukan JSON yang sah." }, { status: 400 });
  }

  const cerita = typeof body.cerita === "string" ? body.cerita.trim() : "";
  if (!cerita) {
    return Response.json({ pesan: "Cerita tidak boleh kosong." }, { status: 400 });
  }

  const fromLlm = await parseWithLlm(cerita);
  const brief = fromLlm ?? parseFallback(cerita);
  const source: "llm" | "fallback" = fromLlm ? "llm" : "fallback";

  const templates = await getVisibleTemplateCatalogFromDatabase();
  const results = matchTemplates(brief, templates);

  return Response.json({ source, results });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/ai-match/route.test.ts --no-file-parallelism`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai-match/route.ts src/app/api/ai-match/route.test.ts
git commit -m "feat(ai-match): add POST /api/ai-match route"
```

---

### Task 6: Catalog highlights the matched template

**Files:**
- Modify: `src/features/showroom/catalog.tsx`
- Modify: `src/features/showroom/catalog.test.tsx`

**Interfaces:**
- Consumes: `MatchResult` from `@/features/ai-match/match` (Task 3).
- Produces: `Catalog` gains an optional `matchResults?: readonly MatchResult[]` prop; when present, the catalog re-sorts to put the top match first, badges it "Cocok untukmu" (only when its score > 0), shows its `reasons`, and passes its recommended `paletteKey` (instead of `palettes[0]`) into that card's thumbnail and `WhatsAppCta`.

- [ ] **Step 1: Write the failing tests**

Add to the end of `describe("Catalog", ...)` in `src/features/showroom/catalog.test.tsx` (keep the existing tests as-is):

```tsx
  it("promotes the top match to the front, badges it, and applies its recommended palette", () => {
    render(
      <Catalog
        templates={catalogTemplates}
        canonicalOrigin="https://undango.test"
        matchResults={[
          {
            templateKey: "template-3",
            templateVersion: 1,
            slug: "taman-aksara",
            score: 3,
            reasons: ['cocok dengan kategori "botanical"'],
            paletteKey: "mawar",
          },
          { templateKey: "template-1", templateVersion: 1, slug: "larasati", score: 0, reasons: [], paletteKey: "gading" },
          { templateKey: "template-2", templateVersion: 1, slug: "pesisir-senja", score: 0, reasons: [], paletteKey: "terakota" },
        ]}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings[0]).toBe("Taman Aksara");
    expect(screen.getByText("Cocok untukmu")).toBeInTheDocument();
    expect(screen.getByText('cocok dengan kategori "botanical"')).toBeInTheDocument();
  });

  it("does not badge any card when the top match score is zero", () => {
    render(
      <Catalog
        templates={catalogTemplates}
        canonicalOrigin="https://undango.test"
        matchResults={[
          { templateKey: "template-1", templateVersion: 1, slug: "larasati", score: 0, reasons: [], paletteKey: "gading" },
          { templateKey: "template-2", templateVersion: 1, slug: "pesisir-senja", score: 0, reasons: [], paletteKey: "terakota" },
          { templateKey: "template-3", templateVersion: 1, slug: "taman-aksara", score: 0, reasons: [], paletteKey: "lumut" },
        ]}
      />,
    );

    expect(screen.queryByText("Cocok untukmu")).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/showroom/catalog.test.tsx --no-file-parallelism -t "promotes the top match"`
Expected: FAIL — `matchResults` prop doesn't exist / "Cocok untukmu" not found.

- [ ] **Step 3: Modify `catalog.tsx`**

Add the import:

```tsx
import type { MatchResult } from "@/features/ai-match/match";
```

Replace the function signature and the pre-filter setup:

```tsx
export function Catalog({
  templates,
  canonicalOrigin = "",
  matchResults,
}: {
  templates: readonly TemplateCatalogItem[];
  canonicalOrigin?: string;
  matchResults?: readonly MatchResult[];
}) {
  const visibleTemplates = templates.filter((template) => template.isVisible);
  const categories = [
    allCategoriesLabel,
    ...Array.from(new Set(visibleTemplates.map((template) => template.category))),
  ];
  const [activeCategory, setActiveCategory] = useState(allCategoriesLabel);
  const rankByTemplateKey = new Map(matchResults?.map((result, index) => [result.templateKey, index]));
  const bestMatch = matchResults?.[0];
  const filteredTemplates = visibleTemplates
    .filter(
      (template) =>
        activeCategory === allCategoriesLabel || template.category === activeCategory,
    )
    .slice()
    .sort(
      (a, b) =>
        (rankByTemplateKey.get(a.templateKey) ?? Infinity) -
        (rankByTemplateKey.get(b.templateKey) ?? Infinity),
    );
```

Replace the start of the card-rendering map (the `const palette = template.palettes[0];` line and the heading block) with:

```tsx
        {filteredTemplates.map((template) => {
          const isRecommended =
            bestMatch !== undefined && bestMatch.score > 0 && bestMatch.templateKey === template.templateKey;
          const palette =
            (isRecommended && template.palettes.find((candidate) => candidate.key === bestMatch.paletteKey)) ||
            template.palettes[0];

          return (
            <article key={`${template.templateKey}-${template.templateVersion}`} className="border border-stone-300 bg-white p-3">
              <div
                className={`template-thumbnail template-thumbnail-${template.previewStyle} aspect-[4/5] p-5`}
                style={{
                  backgroundColor: palette.tokens.canvas,
                  color: palette.tokens.ink,
                  "--thumbnail-accent": palette.tokens.accent,
                  "--thumbnail-line": palette.tokens.line,
                  "--thumbnail-surface": palette.tokens.surface,
                } as React.CSSProperties}
                aria-hidden="true"
              >
                <span className="template-thumbnail-mark">{template.name.slice(0, 1)}</span>
                <span className="template-thumbnail-copy">{template.category}</span>
              </div>
              <div className="px-2 pb-2 pt-5">
                <p className="text-xs font-semibold tracking-[0.15em] text-stone-500 uppercase">
                  {template.category}
                </p>
                {isRecommended && (
                  <p className="mt-2 inline-block bg-amber-900 px-2 py-1 text-xs font-semibold text-amber-50">
                    Cocok untukmu
                  </p>
                )}
                <h3 className="mt-2 font-serif text-3xl text-stone-900">{template.name}</h3>
                {isRecommended && bestMatch.reasons.length > 0 && (
                  <p className="mt-1 text-xs text-amber-900">{bestMatch.reasons.join(", ")}</p>
                )}
                <p className="mt-3 min-h-12 text-sm leading-6 text-stone-600">{template.description}</p>
```

Leave the rest of the file (price line, preview/WhatsApp links, closing tags) unchanged — it already references `palette` and `template`, which still resolve correctly.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/showroom/catalog.test.tsx --no-file-parallelism`
Expected: PASS for the 2 new tests. (The pre-existing `"Lihat preview Larasati"` test may still fail per the Global Constraints note — confirm it fails for the *same* reason as before your change, not a new one.)

- [ ] **Step 5: Commit**

```bash
git add src/features/showroom/catalog.tsx src/features/showroom/catalog.test.tsx
git commit -m "feat(showroom): highlight AI-matched template and palette in the catalog"
```

---

### Task 7: AiMatchBox component

**Files:**
- Create: `src/features/showroom/ai-match-box.tsx`
- Test: `src/features/showroom/ai-match-box.test.tsx`

**Interfaces:**
- Consumes: `MatchResult` from `@/features/ai-match/match` (Task 3).
- Produces: `type AiMatchResponse = { source: "llm" | "fallback"; results: MatchResult[] }`; `AiMatchBox({ onMatched: (response: AiMatchResponse) => void })` — a form with a labeled textarea ("Ceritakan pernikahanmu") and a submit button ("Cocokkan template") that POSTs to `/api/ai-match`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/showroom/ai-match-box.test.tsx
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiMatchBox } from "@/features/showroom/ai-match-box";

describe("AiMatchBox", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("submits the story and reports the match result", async () => {
    const onMatched = vi.fn();
    const response = { source: "fallback", results: [] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    });

    render(<AiMatchBox onMatched={onMatched} />);

    fireEvent.change(screen.getByLabelText("Ceritakan pernikahanmu"), {
      target: { value: "Pernikahan adat Jawa yang hangat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cocokkan template" }));

    await waitFor(() => expect(onMatched).toHaveBeenCalledWith(response));
    expect(fetch).toHaveBeenCalledWith(
      "/api/ai-match",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ cerita: "Pernikahan adat Jawa yang hangat" }),
      }),
    );
  });

  it("shows an error and does not call onMatched when the request fails", async () => {
    const onMatched = vi.fn();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ pesan: "Gagal mencocokkan template." }),
    });

    render(<AiMatchBox onMatched={onMatched} />);

    fireEvent.change(screen.getByLabelText("Ceritakan pernikahanmu"), {
      target: { value: "Cerita apa saja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cocokkan template" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal mencocokkan template.");
    expect(onMatched).not.toHaveBeenCalled();
  });

  it("disables submit until the textarea has content", () => {
    render(<AiMatchBox onMatched={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cocokkan template" })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/showroom/ai-match-box.test.tsx --no-file-parallelism`
Expected: FAIL — `Cannot find module '@/features/showroom/ai-match-box'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/showroom/ai-match-box.tsx
"use client";

import { useState, type FormEvent } from "react";
import type { MatchResult } from "@/features/ai-match/match";

export type AiMatchResponse = {
  source: "llm" | "fallback";
  results: MatchResult[];
};

export function AiMatchBox({ onMatched }: { onMatched: (response: AiMatchResponse) => void }) {
  const [cerita, setCerita] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = cerita.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cerita: trimmed }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.pesan ?? "Gagal mencocokkan template.");
      }

      onMatched(body as AiMatchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mx-auto max-w-3xl px-5 pb-4 sm:px-8"
      aria-label="Cocokkan template dengan ceritamu"
    >
      <label htmlFor="ai-match-cerita" className="text-sm font-semibold tracking-[0.1em] text-stone-700 uppercase">
        Ceritakan pernikahanmu
      </label>
      <textarea
        id="ai-match-cerita"
        value={cerita}
        onChange={(event) => setCerita(event.target.value)}
        placeholder="Contoh: pernikahan adat Jawa yang hangat, di Yogyakarta"
        rows={3}
        className="mt-2 w-full border border-stone-300 bg-white p-3 text-sm text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !cerita.trim()}
          className="inline-flex min-h-11 items-center justify-center bg-stone-900 px-5 text-sm font-semibold text-stone-50 transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Mencocokkan…" : "Cocokkan template"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/showroom/ai-match-box.test.tsx --no-file-parallelism`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/showroom/ai-match-box.tsx src/features/showroom/ai-match-box.test.tsx
git commit -m "feat(showroom): add AiMatchBox story input"
```

---

### Task 8: Wire AiMatchBox and Catalog together, mount on the showroom page

**Files:**
- Create: `src/features/showroom/showroom-experience.tsx`
- Test: `src/features/showroom/showroom-experience.test.tsx`
- Modify: `src/app/(showroom)/page.tsx`

**Interfaces:**
- Consumes: `AiMatchBox`, `AiMatchResponse` from `./ai-match-box` (Task 7); `Catalog` from `./catalog` (Task 6); `TemplateCatalogItem` from `@/features/templates/types` (existing).
- Produces: `ShowroomExperience({ templates: readonly TemplateCatalogItem[]; canonicalOrigin?: string })` — renders `AiMatchBox` above `Catalog`, lifts the match result into `Catalog`'s `matchResults` prop, and shows a "mode sederhana" notice when `source === "fallback"`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/showroom/showroom-experience.test.tsx
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShowroomExperience } from "@/features/showroom/showroom-experience";
import { templateRegistry } from "@/features/templates/registry";
import type { TemplateCatalogItem } from "@/features/templates/types";

const templates: TemplateCatalogItem[] = templateRegistry.map((template, index) => ({
  templateKey: template.templateKey,
  templateVersion: template.templateVersion,
  slug: ["larasati", "pesisir-senja", "taman-aksara"][index],
  name: ["Larasati", "Pesisir Senja", "Taman Aksara"][index],
  category: ["Klasik", "Modern", "Botanical"][index],
  description: "Deskripsi katalog",
  priceInRupiah: 650000,
  marketingThumbnail: null,
  displayOrder: (index + 1) * 10,
  status: "VISIBLE",
  isVisible: true,
  contentSchemaVersion: template.contentSchemaVersion,
  previewStyle: template.previewStyle,
  capabilities: template.capabilities,
  palettes: template.palettes,
  demo: template.demo,
}));

describe("ShowroomExperience", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("reorders and badges the catalog once a match comes back, and shows the fallback notice", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          source: "fallback",
          results: [
            {
              templateKey: "template-3",
              templateVersion: 1,
              slug: "taman-aksara",
              score: 3,
              reasons: ['cocok dengan kategori "botanical"'],
              paletteKey: "mawar",
            },
            { templateKey: "template-1", templateVersion: 1, slug: "larasati", score: 0, reasons: [], paletteKey: "gading" },
            { templateKey: "template-2", templateVersion: 1, slug: "pesisir-senja", score: 0, reasons: [], paletteKey: "terakota" },
          ],
        }),
    });

    render(<ShowroomExperience templates={templates} canonicalOrigin="https://undango.test" />);

    fireEvent.change(screen.getByLabelText("Ceritakan pernikahanmu"), {
      target: { value: "Pesta taman yang penuh bunga" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cocokkan template" }));

    await waitFor(() => expect(screen.getByText("Cocok untukmu")).toBeInTheDocument());
    expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent("Taman Aksara");
    expect(screen.getByRole("status")).toHaveTextContent("mode sederhana");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/showroom/showroom-experience.test.tsx --no-file-parallelism`
Expected: FAIL — `Cannot find module '@/features/showroom/showroom-experience'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/showroom/showroom-experience.tsx
"use client";

import { useState } from "react";
import { AiMatchBox, type AiMatchResponse } from "./ai-match-box";
import { Catalog } from "./catalog";
import type { TemplateCatalogItem } from "@/features/templates/types";

export function ShowroomExperience({
  templates,
  canonicalOrigin,
}: {
  templates: readonly TemplateCatalogItem[];
  canonicalOrigin?: string;
}) {
  const [match, setMatch] = useState<AiMatchResponse | null>(null);

  return (
    <>
      <AiMatchBox onMatched={setMatch} />
      {match?.source === "fallback" && (
        <p role="status" className="mx-auto max-w-3xl px-5 pb-6 text-xs leading-relaxed text-amber-900 sm:px-8">
          Pakai mode sederhana — hasilnya mungkin kurang presisi.
        </p>
      )}
      <Catalog templates={templates} canonicalOrigin={canonicalOrigin} matchResults={match?.results} />
    </>
  );
}
```

Then modify `src/app/(showroom)/page.tsx`: replace

```tsx
import { Catalog } from "@/features/showroom/catalog";
```

with

```tsx
import { ShowroomExperience } from "@/features/showroom/showroom-experience";
```

and replace

```tsx
      <div id="koleksi">
        <Catalog templates={templates} canonicalOrigin={`${protocol}://${host}`} />
      </div>
```

with

```tsx
      <div id="koleksi">
        <ShowroomExperience templates={templates} canonicalOrigin={`${protocol}://${host}`} />
      </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/showroom/showroom-experience.test.tsx --no-file-parallelism`
Expected: PASS (1 test)

- [ ] **Step 5: Typecheck the whole project**

Run: `corepack pnpm run typecheck`
Expected: no errors (confirms `page.tsx`'s import swap compiles).

- [ ] **Step 6: Commit**

```bash
git add src/features/showroom/showroom-experience.tsx src/features/showroom/showroom-experience.test.tsx "src/app/(showroom)/page.tsx"
git commit -m "feat(showroom): mount AI template matching on the showroom page"
```

---

### Task 9: Local verification before push

This task is manual — it is the "run di localhost dulu sebelum dipush ke github" step the user explicitly asked for. Do not push to GitHub until every item below is confirmed.

- [ ] **Step 1: Run the full automated test suite**

Run: `corepack pnpm test`
Expected: every test file passes except the pre-existing, unrelated `catalog.test.tsx` aria-label failure noted in Global Constraints (confirm no *new* failures were introduced).

- [ ] **Step 2: Run lint**

Run: `corepack pnpm run lint`
Expected: no errors in the new/modified files.

- [ ] **Step 3: Confirm local Postgres is up and the template catalog is seeded**

The showroom already depends on this for its existing (non-AI) rendering, so if `http://localhost:3000` currently shows the 3 templates, this is already satisfied. If not: start Postgres, then run `corepack pnpm run templates:reconcile`.

- [ ] **Step 4: Start the dev server**

Run: `corepack pnpm dev` (leave running)

- [ ] **Step 5: Manually exercise the feature in a browser**

Open `http://localhost:3000`, scroll to the showroom collection, and check:
- The "Ceritakan pernikahanmu" box renders above the template grid.
- Typing a story like "Pernikahan adat Jawa yang hangat di Yogyakarta" and clicking "Cocokkan template" shows a loading state, then reorders "Larasati" to the front with a "Cocok untukmu" badge and a visible reason.
- The "Pesan" (WhatsApp) link on the recommended card, when inspected/hovered, encodes the recommended palette (e.g. `soga`) rather than the template's default first palette.
- Typing an unrelated story (e.g. "kami menikah tahun depan") shows all 3 templates with no badge (score 0 across the board).
- The category filter buttons above the grid still work after a match has been applied.
- Temporarily comment out `OPENAI_API_KEY` in `.env`, restart the dev server, repeat the Jawa story test, and confirm the fallback still recommends "Larasati" and shows the "mode sederhana" notice — then restore the key.

- [ ] **Step 6: Report back to the user**

Summarize what was tested and ask for explicit confirmation before pushing to GitHub.
