# AI Template Matching — Design Spec

Date: 2026-08-06
Status: Approved for planning

## Background

`undangan-digital` (a sibling prototype project) has a working "describe your
wedding in free text → get a matched template" feature: an LLM (gpt-4o-mini)
extracts a structured brief from a free-text prompt, a deterministic
rule-based scorer (`cocokkanTemplate`) ranks the template catalog against
that brief, and the user sees ranked recommendations with a live preview.

kamukamiundang is a separate, production-shaped SaaS (Prisma-backed catalog,
3 React-rendered templates, WhatsApp-based manual ordering). It has no
free-text entry point, no dynamic color engine, and no self-serve checkout.
This spec adapts the *matching* idea from undangan-digital into
kamukamiundang's actual architecture — it does not port undangan-digital's
code or its dynamic OKLCH color engine, which has no equivalent here.

## Goal

Add a "describe your wedding" box to the showroom page. It recommends one of
the 3 existing templates (and one of that template's 3 existing palettes),
with a short reason, and re-ranks the catalog so the recommended template
surfaces first. The existing WhatsApp ordering flow is reused as-is, just
pre-selecting the recommended palette.

Out of scope: prefilling couple names/date/venue into template content,
live preview with user-specific content, a new dynamic color engine, and
any change to the order/checkout flow itself.

## Data flow

```
User types free text → POST /api/ai-match { cerita }
  → parseWithLlm(cerita)          [gpt-4o-mini, temperature 0, 20s timeout]
     success → brief { kategori, nuansa }
     failure or no OPENAI_API_KEY → parseFallback(cerita)  [keyword scan]
  → matchTemplates(brief, getVisibleTemplateCatalog())
  → response { source: "llm" | "fallback", results: MatchResult[] }
```

Brief shape (deliberately small — no name/date/venue extraction, unlike
undangan-digital, since kamukamiundang has no content-prefill flow yet):

```ts
type MatchBrief = {
  kategori: "klasik" | "modern" | "botanical" | null;
  nuansa: "muted" | "warm" | "bold" | null;
};
```

## Tagging & scoring

New module `src/features/ai-match/tags.ts` holds a static keyword list per
`templateKey`, derived from the existing `templateCatalogBootstrap` category
and description copy:

- `template-1` (Larasati / klasik): jawa, klasik, adat, tradisional, elegan,
  formal, kraton
- `template-2` (Pesisir Senja / modern): modern, pantai, pesisir, senja,
  sunset, minimalis, outdoor
- `template-3` (Taman Aksara / botanical): botanical, taman, garden, bunga,
  alam, kontemporer, intim, rustic

`src/features/ai-match/match.ts` exports a pure function:

```ts
function matchTemplates(
  brief: MatchBrief,
  templates: readonly TemplateCatalogItem[],
): MatchResult[]
```

Scoring mirrors `cocokkanTemplate` in undangan-digital: category match is
weighted heavily, nuansa match lightly, ties break on catalog
`displayOrder`. All templates are always returned (score 0 included) so the
UI always has 3 cards, not just a winner.

`MatchResult` includes a suggested `paletteKey`. All 3 templates currently
follow the same palette ordering convention (index 0 = neutral/light, index
1 = warm/saturated, index 2 = dark), confirmed by inspecting each
`definition.ts`. `nuansa` → palette index mapping is therefore a static
table, not computed dynamically:

- `muted` → palette index 0
- `warm` → palette index 1
- `bold` → palette index 2

If `brief.nuansa` is null, the suggested palette defaults to index 0 (same
as current showroom default).

## Fallback without LLM

`src/features/ai-match/rule-fallback.ts` runs when `OPENAI_API_KEY` is
unset or the OpenAI call throws/times out. It scans the raw user text
(case-insensitive substring match) against the same tag keywords per
category, and a separate small nuansa keyword list (e.g. "gelap/malam" →
bold, "pastel/lembut/cerah" → muted, "hangat/sunset/earthy" → warm).
Unmatched text yields `{ kategori: null, nuansa: null }`. The API route
always returns `200 OK`; `source: "fallback"` signals the client to show a
small "mode sederhana" notice, never an error.

## API route

`src/app/api/ai-match/route.ts`, `POST`, body `{ cerita: string }`.

- Validates `cerita` is a non-empty string (400 otherwise).
- Calls `parseWithLlm`, falls back to `parseFallback` on `null`.
- Calls `matchTemplates` against `getVisibleTemplateCatalog()`.
- Returns `{ source, results: [{ templateKey, slug, score, reasons: string[], paletteKey }] }`.

## UI

New client component `src/features/showroom/ai-match-box.tsx`, rendered
above `<Catalog>` in `(showroom)/page.tsx`. Copy in Indonesian, consistent
with the rest of the showroom.

- Textarea + "Cocokkan template" button.
- Loading: button disabled, label "Mencocokkan…".
- Network/API error: short inline error message + "Coba lagi" button; the
  catalog below stays visible and unaffected.
- On success: match state is lifted to the showroom page (page becomes a
  thin client wrapper holding `matchResults` state) and passed into
  `Catalog` as a prop.
- `Catalog` re-sorts so the top match renders first, adds a "Cocok
  untukmu" badge and the `reasons` text on that card, and passes the
  recommended `paletteKey` (instead of `palettes[0]`) into that card's
  `WhatsAppCta`.
- `source === "fallback"` shows a small amber notice near the box, same
  tone as undangan-digital's "mode sederhana" banner.
- No changes to `/templates/[slug]`, the WhatsApp message format, or order
  creation.

## Testing

- `src/features/ai-match/match.test.ts` — category match, nuansa match,
  tie-breaking on `displayOrder`, all templates always present in results.
- `src/features/ai-match/rule-fallback.test.ts` — keyword hits per
  category/nuansa, unmatched text → both null.
- `src/app/api/ai-match/route.test.ts` — follows the existing pattern in
  `src/app/api/analytics/events/route.test.ts`; mock LLM failure and
  confirm fallback path still returns 200 with `source: "fallback"`.

## Environment

Add `OPENAI_API_KEY` to `kamukamiundang/.env`, reusing the key already
present in `undangan-digital/.env.local` for local testing. No other env
changes.

## Verification before push

Run locally (`pnpm dev`) and manually test the showroom flow — type a
story, confirm a recommendation appears, confirm the WhatsApp link carries
the recommended palette — before anything is pushed to GitHub, per the
user's explicit instruction for this task.
