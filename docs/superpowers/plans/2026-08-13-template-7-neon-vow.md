# Template-7 "Neon Vow" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 7th invitation template (`template-7`, "Neon Vow") to the catalog: a neon-lime/black editorial-style renderer inspired by `wedding20251012-ny.studio.site`, with its own bespoke renderer (not `InvitationExperience`), reusing the existing `cahaya` stock photo set.

**Architecture:** One new `TemplateRuntimeManifest` (`template-7/v1/definition.ts`) registered in `registry.tsx`, backed by a self-contained client component (`template-7/v1/renderer.tsx`) that reimplements the cover-lock/section/form pattern already proven in `InvitationExperience`, but with template-7's own visual language: neon-lime palette, oversized italic serif type, a `position: sticky` ghost-text section standing in for the reference site's pinned-scroll effect, and inline SVG orbit/spark ornaments. Content shape is the existing, unchanged `TemplateContentViewModel`.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Tailwind CSS 4 utility classes only (no new CSS files), Zod (reusing `rsvpDemoSchema`/`wishDemoSchema`), Vitest + Testing Library, Prisma/PostgreSQL for catalog reconciliation.

## Global Constraints

Copied verbatim from `docs/templates/authoring-guide.md` and the approved spec (`docs/superpowers/specs/2026-08-13-template-7-neon-vow-design.md`). Every task below implicitly must satisfy these:

- Cover uses `min-height: 100dvh` (`h-dvh` in Tailwind); content stays locked until the open button is activated; focus moves to main content on open.
- The open button and every interactive element must be keyboard-operable.
- No `wheel`/`touchmove` `preventDefault` hijacking anywhere **except** the pre-open cover lock (an established, repo-wide pattern already used by all 6 existing templates) — the sticky ghost-text section must use pure CSS `position: sticky`, never scroll interception.
- `prefers-reduced-motion` must be respected (use Tailwind's `motion-safe:`/`motion-reduce:` variants; nothing animation-dependent may be required to read content).
- No horizontal overflow at 360px viewport width.
- No autoplay audio or video.
- External links (Maps, Instagram) use `target="_blank" rel="noreferrer"`.
- The renderer accepts only `{ content, palette }` — no DB, request, or env access from renderer code.
- Optional sections (`gallery`, `gift`, `rsvp`, `wishes`) must not render any wrapper, heading, or spacing when their content field is `undefined`.
- Business metadata (marketing name, slug, price, category, description) lives in `catalog-schema.ts`'s bootstrap list / Postgres, never hardcoded as a runtime "fallback" inside the renderer or definition beyond what `catalog-schema.ts` already requires.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` must all pass before the branch is done.
- All new prose/demo copy is in Bahasa Indonesia, consistent with `template-1`..`template-6`.

---

### Task 1: Widen the runtime `previewStyle` contract

**Files:**
- Modify: `src/features/templates/types.ts:119`

**Interfaces:**
- Consumes: nothing new.
- Produces: `TemplateRuntimeManifest["previewStyle"]` now includes the literal `"editorial"`, which Task 2's `definition.ts` requires to typecheck.

- [ ] **Step 1: Widen the union type**

In `src/features/templates/types.ts`, change line 119 from:

```ts
  previewStyle: "arch" | "coast" | "garden" | "crescent" | "noir" | "line";
```

to:

```ts
  previewStyle: "arch" | "coast" | "garden" | "crescent" | "noir" | "line" | "editorial";
```

- [ ] **Step 2: Verify the project still typechecks**

Run: `pnpm typecheck`
Expected: PASS (this is a strict widening of a union; nothing currently narrows on the old set exhaustively in a way that would break).

- [ ] **Step 3: Commit**

```bash
git add src/features/templates/types.ts
git commit -m "feat(templates): widen previewStyle union for template-7"
```

---

### Task 2: Build `template-7` definition, renderer, and tests

**Files:**
- Create: `src/features/templates/template-7/v1/definition.ts`
- Create: `src/features/templates/template-7/v1/renderer.tsx`
- Create: `src/features/templates/template-7/v1/renderer.test.tsx`
- Modify: `src/features/templates/registry.tsx`
- Modify: `src/features/templates/registry.test.ts`

**Interfaces:**
- Consumes: `TemplateRendererProps` (`{ content: TemplateContentViewModel; palette: TemplatePalette }`) from `src/features/templates/types.ts`; `rsvpDemoSchema`, `wishDemoSchema` from `src/features/forms/schemas.ts`; the widened `previewStyle` union from Task 1.
- Produces: `templateSevenV1: TemplateRuntimeManifest` (exported from `definition.ts`) and `TemplateSevenRenderer` (exported from `renderer.tsx`), registered in `templateRegistry` so `getTemplateRuntimeManifest("template-7", 1)` resolves.

- [ ] **Step 1: Write the renderer test file first (it will fail — nothing exists yet)**

Create `src/features/templates/template-7/v1/renderer.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateSevenV1 } from "@/features/templates/template-7/v1/definition";

describe("TemplateSevenRenderer", () => {
  afterEach(cleanup);

  it("renders demo content, event details, and a working maps link after opening", () => {
    const Renderer = templateSevenV1.renderer;

    render(
      <Renderer
        content={templateSevenV1.demo.content}
        palette={templateSevenV1.palettes[0]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(
      screen.getByRole("heading", { name: "Alika & Bregas" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Minggu, 12 Oktober 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Akad Nikah")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Buka Google Maps" })[0]).toHaveAttribute(
      "href",
      "https://maps.google.com/?q=Kudus+Convention+Hall",
    );
  }, 15_000);

  it("keeps three named palette choices", () => {
    expect(templateSevenV1.palettes.map((palette) => palette.key)).toEqual([
      "lumen",
      "kelam",
      "kertas",
    ]);
  });

  it("omits optional sections when their content is absent", () => {
    const Renderer = templateSevenV1.renderer;
    const { gift, rsvp, wishes, ...requiredContent } = templateSevenV1.demo.content;

    render(<Renderer content={requiredContent} palette={templateSevenV1.palettes[0]} />);
    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(screen.queryByRole("heading", { name: "Sampaikan kehadiran" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tanda kasih" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Kirimkan kata baik" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `pnpm vitest run src/features/templates/template-7/v1/renderer.test.tsx`
Expected: FAIL — cannot resolve `@/features/templates/template-7/v1/definition`.

- [ ] **Step 3: Create the renderer**

Create `src/features/templates/template-7/v1/renderer.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { TemplateRendererProps } from "@/features/templates/types";
import { rsvpDemoSchema, wishDemoSchema } from "@/features/forms/schemas";

function OrbitLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="100" cy="40" rx="98" ry="30" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
    </svg>
  );
}

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
    </svg>
  );
}

function Heading({ eyebrow, title, accent }: { eyebrow: string; title: string; accent: string }) {
  return (
    <header>
      <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: accent }}>
        {eyebrow}
      </p>
      <h2 className="mt-4 font-serif text-3xl italic leading-tight sm:text-4xl">{title}</h2>
    </header>
  );
}

function getRemaining(target: string) {
  const difference = Math.max(0, new Date(target).getTime() - Date.now());
  const seconds = Math.floor(difference / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return {
    hari: String(days).padStart(2, "0"),
    jam: String(hours).padStart(2, "0"),
    menit: String(minutes).padStart(2, "0"),
    detik: String(remainingSeconds).padStart(2, "0"),
  };
}

function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <div className="grid grid-cols-4 gap-3" aria-label="Hitung mundur menuju hari acara">
      {Object.entries(remaining).map(([unit, value]) => (
        <div key={unit} className="border px-2 py-4 text-center" style={{ borderColor: "currentColor" }}>
          <p className="font-serif text-3xl leading-none">{value}</p>
          <p className="mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.16em] opacity-70">{unit}</p>
        </div>
      ))}
    </div>
  );
}

export function TemplateSevenRenderer({ content, palette }: TemplateRendererProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [wishSent, setWishSent] = useState(false);
  const [rsvpErrors, setRsvpErrors] = useState<Record<string, string>>({});
  const [wishErrors, setWishErrors] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function openInvitation() {
    setIsOpen(true);
    window.setTimeout(() => contentRef.current?.focus(), 0);
  }

  function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = rsvpDemoSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget).entries()),
    );
    if (!result.success) {
      setRsvpErrors(
        Object.fromEntries(
          Object.entries(result.error.flatten().fieldErrors).map(([field, errors]) => [field, errors?.[0] ?? ""]),
        ),
      );
      return;
    }
    setRsvpErrors({});
    setRsvpSent(true);
  }

  function submitWish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = wishDemoSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget).entries()),
    );
    if (!result.success) {
      setWishErrors(
        Object.fromEntries(
          Object.entries(result.error.flatten().fieldErrors).map(([field, errors]) => [field, errors?.[0] ?? ""]),
        ),
      );
      return;
    }
    setWishErrors({});
    setWishSent(true);
  }

  async function copyAccount(accountNumber: string) {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(accountNumber);
    } catch {
      // Feedback below still confirms the attempt even when clipboard permission is denied.
    }
    setCopiedAccount(accountNumber);
    window.setTimeout(() => setCopiedAccount(null), 2200);
  }

  return (
    <article
      data-testid="invitation-experience"
      data-invitation-locked={!isOpen}
      className="invitation-experience invitation-editorial relative mx-auto max-w-[30rem] overflow-hidden border"
      style={{ backgroundColor: palette.tokens.canvas, borderColor: palette.tokens.line, color: palette.tokens.ink }}
      onWheel={(event) => {
        if (!isOpen) event.preventDefault();
      }}
      onTouchMove={(event) => {
        if (!isOpen) event.preventDefault();
      }}
    >
      {!isOpen && (
        <div
          data-testid="invitation-cover"
          className="absolute inset-x-0 top-0 z-20 flex h-dvh flex-col justify-between overflow-hidden px-7 py-10 text-center sm:px-12"
          style={{ backgroundColor: palette.tokens.canvas, color: palette.tokens.ink }}
          onWheel={(event) => event.preventDefault()}
          onTouchMove={(event) => event.preventDefault()}
        >
          <OrbitLine className="pointer-events-none absolute inset-x-4 top-24 h-24 w-[calc(100%-2rem)] motion-safe:animate-[spin_60s_linear_infinite]" />
          <Spark className="pointer-events-none absolute right-8 top-16 h-4 w-4 opacity-70" />
          <Spark className="pointer-events-none absolute bottom-40 left-10 h-3 w-3 opacity-50" />
          <div className="relative z-10 flex justify-between text-[0.6rem] font-semibold uppercase tracking-[0.2em] opacity-70">
            <span>{content.eyebrow}</span>
            <span>Undangan</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">{content.cover.title}</p>
            <h1 className="mt-6 font-serif text-[clamp(3rem,14vw,5rem)] italic leading-[0.85]">
              {content.couple.firstName}
              <span className="not-italic opacity-60"> &amp; </span>
              {content.couple.secondName}
            </h1>
            <p className="mt-8 text-xs uppercase tracking-[0.2em] opacity-70">{content.cover.recipientLabel}</p>
            <p className="mt-2 font-serif text-xl">{content.cover.recipientName}</p>
          </div>
          <div className="relative z-10">
            <button
              type="button"
              className="min-h-12 border px-6 text-xs font-semibold uppercase tracking-[0.18em] transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              style={{ borderColor: palette.tokens.ink }}
              onClick={openInvitation}
            >
              Buka undangan
            </button>
            <p className="mt-5 text-[0.65rem] opacity-60">Geser setelah undangan dibuka</p>
          </div>
        </div>
      )}

      <main
        id="invitation-content"
        data-testid="invitation-content"
        ref={contentRef}
        tabIndex={-1}
        className="outline-none"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        <section className="relative flex min-h-[88dvh] flex-col justify-end overflow-hidden px-7 py-10 sm:px-12">
          <OrbitLine className="pointer-events-none absolute -right-10 top-10 h-32 w-64 opacity-40" />
          <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: palette.tokens.accent }}>
            {content.eyebrow}
          </p>
          <h2 className="relative z-10 mt-5 font-serif text-[clamp(2.75rem,12vw,4.5rem)] italic leading-[0.88]">
            {content.couple.firstName}
            <span className="not-italic opacity-55"> &amp; </span>
            {content.couple.secondName}
          </h2>
          <p className="relative z-10 mt-7 max-w-xs text-sm leading-7" style={{ color: palette.tokens.muted }}>
            {content.opening}
          </p>
          <p className="relative z-10 mt-8 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.tokens.accent }}>
            {content.eventDate}
          </p>
        </section>

        <section className="relative">
          <div
            className="sticky top-0 z-0 flex h-dvh items-center justify-center overflow-hidden"
            aria-hidden="true"
            style={{ backgroundColor: palette.tokens.canvas }}
          >
            <span className="select-none whitespace-nowrap font-serif text-[26vw] italic leading-none opacity-10">
              {content.eyebrow}
            </span>
          </div>
          <div className="relative z-10 -mt-[65dvh] flex min-h-[65dvh] items-center px-8 py-20 sm:px-16">
            <blockquote className="mx-auto max-w-lg text-center font-serif text-3xl italic leading-relaxed sm:text-4xl">
              &ldquo;{content.quote}&rdquo;
            </blockquote>
          </div>
        </section>

        <section className="px-7 py-14 sm:px-12">
          <Heading eyebrow="Kedua mempelai" title="Dengan penuh kasih" accent={palette.tokens.accent} />
          <div className="mt-10 grid gap-10">
            {content.profiles.map((profile, index) => (
              <div key={profile.name} className="border-b pb-8" style={{ borderColor: palette.tokens.line }}>
                <p className="font-serif text-5xl italic opacity-20">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: palette.tokens.accent }}>
                  {profile.role}
                </p>
                <h3 className="mt-3 font-serif text-3xl italic">{profile.name}</h3>
                <p className="mt-3 text-sm leading-6" style={{ color: palette.tokens.muted }}>
                  {profile.parents}
                </p>
                {profile.instagram && (
                  <a
                    className="mt-4 inline-block text-xs font-semibold tracking-[0.12em] underline underline-offset-4"
                    href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {profile.instagram}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="px-7 py-14 sm:px-12" style={{ backgroundColor: palette.tokens.surface }}>
          <Heading eyebrow="Save the date" title={content.eventDate} accent={palette.tokens.accent} />
          <p className="mt-5 text-sm leading-6" style={{ color: palette.tokens.muted }}>
            Menghitung hari menuju perayaan kami.
          </p>
          <div className="mt-8">
            <Countdown target={content.eventDateIso} />
          </div>
        </section>

        <section className="px-7 py-14 sm:px-12">
          <Heading eyebrow="Rangkaian acara" title="Hari yang kami nantikan" accent={palette.tokens.accent} />
          <div className="mt-10 grid gap-5">
            {content.events.map((event) => (
              <div key={event.label} className="border p-5" style={{ borderColor: palette.tokens.line }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.tokens.accent }}>
                  {event.label}
                </p>
                <p className="mt-5 font-serif text-2xl italic">{event.time}</p>
                <p className="mt-2 text-sm font-semibold">{event.date}</p>
                <p className="mt-5 font-semibold">{event.venue}</p>
                <p className="mt-1 text-sm leading-6" style={{ color: palette.tokens.muted }}>
                  {event.address}
                </p>
                <a
                  className="mt-5 inline-block border-b pb-1 text-xs font-semibold"
                  style={{ borderColor: palette.tokens.accent }}
                  href={event.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka Google Maps
                </a>
              </div>
            ))}
          </div>
        </section>

        {content.rsvp && (
          <section className="border-y px-7 py-14 sm:px-12" style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}>
            <Heading eyebrow="RSVP" title="Sampaikan kehadiran" accent={palette.tokens.accent} />
            <p className="mt-5 text-sm leading-6" style={{ color: palette.tokens.muted }}>
              {content.rsvp.intro}
            </p>
            {rsvpSent ? (
              <p className="mt-8 border p-4 text-sm" role="status" style={{ borderColor: palette.tokens.accent }}>
                Terima kasih, konfirmasi Anda sudah tercatat di demo ini.
              </p>
            ) : (
              <form className="mt-8 grid gap-4" noValidate onSubmit={submitRsvp}>
                <label className="grid gap-2 text-xs font-semibold" htmlFor="rsvp-name">
                  Nama
                </label>
                <input
                  id="rsvp-name"
                  name="name"
                  required
                  aria-invalid={Boolean(rsvpErrors.name)}
                  aria-describedby={rsvpErrors.name ? "rsvp-name-error" : undefined}
                  className="min-h-11 border bg-transparent px-3 text-sm focus-visible:outline-2 aria-[invalid=true]:border-red-700"
                  style={{ borderColor: palette.tokens.line }}
                />
                {rsvpErrors.name && (
                  <p id="rsvp-name-error" className="text-xs text-red-800" role="alert">
                    {rsvpErrors.name}
                  </p>
                )}
                <label className="grid gap-2 text-xs font-semibold" htmlFor="rsvp-count">
                  Jumlah tamu
                </label>
                <select
                  id="rsvp-count"
                  name="guests"
                  aria-invalid={Boolean(rsvpErrors.guests)}
                  aria-describedby={rsvpErrors.guests ? "rsvp-count-error" : undefined}
                  className="min-h-11 border bg-transparent px-3 text-sm focus-visible:outline-2 aria-[invalid=true]:border-red-700"
                  style={{ borderColor: palette.tokens.line }}
                  defaultValue="1"
                >
                  {Array.from({ length: content.rsvp.maxGuests }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>
                      {count} tamu
                    </option>
                  ))}
                </select>
                {rsvpErrors.guests && (
                  <p id="rsvp-count-error" className="text-xs text-red-800" role="alert">
                    {rsvpErrors.guests}
                  </p>
                )}
                <fieldset className="grid gap-3 border-0 p-0">
                  <legend className="mb-1 text-xs font-semibold">Kehadiran</legend>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="attendance" value="yes" defaultChecked /> Ya, saya hadir
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="attendance" value="no" /> Maaf, saya tidak dapat hadir
                  </label>
                  {rsvpErrors.attendance && (
                    <p className="text-xs text-red-800" role="alert">
                      {rsvpErrors.attendance}
                    </p>
                  )}
                </fieldset>
                <button
                  type="submit"
                  className="mt-2 min-h-11 border px-4 text-xs font-semibold uppercase tracking-[0.14em]"
                  style={{ borderColor: palette.tokens.accent }}
                >
                  Kirim RSVP
                </button>
              </form>
            )}
          </section>
        )}

        {content.gallery && (
          <section className="px-7 py-14 sm:px-12">
            <Heading eyebrow="Special thanks" title="Sepenggal momen kami" accent={palette.tokens.accent} />
            <p className="mt-5 text-sm leading-6" style={{ color: palette.tokens.muted }}>
              Terima kasih untuk semua yang telah mendukung kami. Berikut beberapa momen dari hari kami.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-2">
              {content.gallery.photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={index === 0 ? "relative col-span-2 aspect-[4/3] overflow-hidden" : "relative aspect-square overflow-hidden"}
                >
                  {photo.src ? (
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 640px) 240px, 50vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={photo.alt}
                      className="h-full w-full"
                      style={{ backgroundColor: palette.tokens.surface }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {content.gift && (
          <section className="px-7 py-14 sm:px-12" style={{ backgroundColor: palette.tokens.surface }}>
            <Heading eyebrow="Wedding gift" title="Tanda kasih" accent={palette.tokens.accent} />
            <p className="mt-5 text-sm leading-7" style={{ color: palette.tokens.muted }}>
              {content.gift.intro}
            </p>
            <div className="mt-8 grid gap-4">
              {content.gift.accounts.map((account) => (
                <div key={account.accountNumber} className="border p-5" style={{ borderColor: palette.tokens.line }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: palette.tokens.accent }}>
                    {account.bank}
                  </p>
                  <p className="mt-3 font-serif text-xl italic">{account.accountNumber}</p>
                  <p className="mt-1 text-sm" style={{ color: palette.tokens.muted }}>
                    {account.accountName}
                  </p>
                  <button
                    type="button"
                    className="mt-4 text-xs font-semibold underline underline-offset-4"
                    onClick={() => void copyAccount(account.accountNumber)}
                  >
                    {copiedAccount === account.accountNumber ? "Tersalin" : "Salin nomor rekening"}
                  </button>
                </div>
              ))}
              {content.gift.physicalAddress && (
                <div className="border p-5 text-sm leading-6" style={{ borderColor: palette.tokens.line }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: palette.tokens.accent }}>
                    Kado fisik
                  </p>
                  <p className="mt-3" style={{ color: palette.tokens.muted }}>
                    {content.gift.physicalAddress}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {content.wishes && (
          <section className="border-y px-7 py-14 sm:px-12" style={{ borderColor: palette.tokens.line }}>
            <Heading eyebrow="Ucapan dan doa" title="Kirimkan kata baik" accent={palette.tokens.accent} />
            <p className="mt-5 text-sm leading-6" style={{ color: palette.tokens.muted }}>
              {content.wishes.prompt}
            </p>
            <div className="mt-8 grid gap-3">
              {content.wishes.entries.map((entry) => (
                <blockquote key={entry.name} className="border-l-2 pl-4 text-sm leading-6" style={{ borderColor: palette.tokens.accent }}>
                  <p>&ldquo;{entry.message}&rdquo;</p>
                  <cite className="mt-2 block text-xs font-semibold not-italic">{entry.name}</cite>
                </blockquote>
              ))}
            </div>
            {wishSent ? (
              <p className="mt-8 text-sm" role="status">
                Terima kasih atas ucapan Anda.
              </p>
            ) : (
              <form className="mt-8 grid gap-4" noValidate onSubmit={submitWish}>
                <label className="grid gap-2 text-xs font-semibold" htmlFor="wish-name">
                  Nama
                </label>
                <input
                  id="wish-name"
                  name="name"
                  required
                  aria-invalid={Boolean(wishErrors.name)}
                  aria-describedby={wishErrors.name ? "wish-name-error" : undefined}
                  className="min-h-11 border bg-transparent px-3 text-sm aria-[invalid=true]:border-red-700"
                  style={{ borderColor: palette.tokens.line }}
                />
                {wishErrors.name && (
                  <p id="wish-name-error" className="text-xs text-red-800" role="alert">
                    {wishErrors.name}
                  </p>
                )}
                <label className="grid gap-2 text-xs font-semibold" htmlFor="wish-message">
                  Ucapan
                </label>
                <textarea
                  id="wish-message"
                  name="message"
                  required
                  maxLength={1000}
                  aria-invalid={Boolean(wishErrors.message)}
                  aria-describedby={wishErrors.message ? "wish-message-error" : undefined}
                  className="min-h-28 border bg-transparent px-3 py-3 text-sm aria-[invalid=true]:border-red-700"
                  style={{ borderColor: palette.tokens.line }}
                />
                {wishErrors.message && (
                  <p id="wish-message-error" className="text-xs text-red-800" role="alert">
                    {wishErrors.message}
                  </p>
                )}
                <button
                  type="submit"
                  className="min-h-11 border px-4 text-xs font-semibold uppercase tracking-[0.14em]"
                  style={{ borderColor: palette.tokens.accent }}
                >
                  Kirim ucapan
                </button>
              </form>
            )}
          </section>
        )}

        <section className="px-7 py-16 text-center sm:px-12">
          <p className="mx-auto max-w-sm font-serif text-2xl italic leading-relaxed">&ldquo;{content.quote}&rdquo;</p>
          <p className="mx-auto mt-8 max-w-sm text-sm leading-7" style={{ color: palette.tokens.muted }}>
            {content.closing}
          </p>
          <p className="mt-8 font-serif text-2xl italic">
            {content.couple.firstName} &amp; {content.couple.secondName}
          </p>
        </section>

        <footer className="px-7 py-8 text-center text-xs" style={{ backgroundColor: palette.tokens.ink, color: palette.tokens.canvas }}>
          {content.branding}
        </footer>
      </main>
    </article>
  );
}
```

- [ ] **Step 4: Create the definition**

Create `src/features/templates/template-7/v1/definition.ts`:

```ts
import { TemplateSevenRenderer } from "@/features/templates/template-7/v1/renderer";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateSevenV1: TemplateRuntimeManifest = {
  templateKey: "template-7",
  templateVersion: 1,
  contentSchemaVersion: 2,
  previewStyle: "editorial",
  capabilities: ["gallery", "gift", "map", "rsvp", "wishes"],
  palettes: [
    {
      key: "lumen",
      name: "Lumen",
      tokens: { canvas: "#E4FA1F", surface: "#D8ED17", ink: "#15150F", muted: "#3f4025", accent: "#15150F", line: "#c7d419" },
    },
    {
      key: "kelam",
      name: "Kelam",
      tokens: { canvas: "#15150F", surface: "#1f2013", ink: "#E4FA1F", muted: "#9aa15c", accent: "#E4FA1F", line: "#3a3b26" },
    },
    {
      key: "kertas",
      name: "Kertas",
      tokens: { canvas: "#F3F1E4", surface: "#EAE6D2", ink: "#1B1B14", muted: "#5B5C3F", accent: "#5B5C3F", line: "#d8d3ba" },
    },
  ],
  demo: {
    paletteKey: "lumen",
    content: {
      eyebrow: "Undangan pernikahan",
      cover: { title: "With love,", recipientLabel: "Kepada", recipientName: "Nama Tamu" },
      couple: { firstName: "Alika", secondName: "Bregas" },
      profiles: [
        {
          name: "Alika Puspita",
          role: "putri",
          parents: "Putri Bapak Handoko Wibisono dan Ibu Ratna Puspita.",
          instagram: "@alikapuspita",
        },
        {
          name: "Bregas Aditama",
          role: "putra",
          parents: "Putra Bapak Yusuf Aditama dan Ibu Sri Lestari.",
          instagram: "@bregasaditama",
        },
      ],
      opening: "Dengan penuh syukur, kami mengundang Anda merayakan hari yang telah lama kami nantikan.",
      quote: "Cinta yang berani memilih untuk terus bertumbuh, bersama.",
      eventDate: "Minggu, 12 Oktober 2026",
      eventDateIso: "2026-10-12T10:00:00+07:00",
      events: [
        {
          label: "Akad Nikah",
          date: "Minggu, 12 Oktober 2026",
          time: "10.00 - 11.00 WIB",
          venue: "Kudus Convention Hall",
          address: "Jl. Sudirman No. 21, Kudus",
          mapUrl: "https://maps.google.com/?q=Kudus+Convention+Hall",
        },
        {
          label: "Resepsi",
          date: "Minggu, 12 Oktober 2026",
          time: "11.30 - 14.00 WIB",
          venue: "Kudus Convention Hall",
          address: "Jl. Sudirman No. 21, Kudus",
          mapUrl: "https://maps.google.com/?q=Kudus+Convention+Hall",
        },
      ],
      gallery: {
        photos: [
          { id: "alika-01", alt: "Alika dan Bregas di depan gedung bersejarah", tone: "night", src: "/images/stock/cahaya-1.jpg" },
          { id: "alika-02", alt: "Potret dekat Alika dan Bregas", tone: "night", src: "/images/stock/cahaya-2.jpg" },
          { id: "alika-03", alt: "Alika dan Bregas dengan buket bunga putih", tone: "sand", src: "/images/stock/cahaya-3.jpg" },
          { id: "alika-04", alt: "Detail momen Alika dan Bregas", tone: "night", src: "/images/stock/cahaya-4.jpg" },
        ],
      },
      gift: {
        intro: "Doa restu Anda adalah hadiah terbesar. Jika ingin memberi tanda kasih, berikut detailnya.",
        accounts: [{ bank: "Bank Nusantara", accountNumber: "8800 1122 33", accountName: "Alika Puspita" }],
      },
      rsvp: {
        intro: "Mohon konfirmasi kehadiran Anda sebelum 1 Oktober 2026.",
        maxGuests: 3,
      },
      wishes: {
        prompt: "Tinggalkan doa dan ucapan terbaik untuk kami.",
        entries: [{ name: "Sinta & Radit", message: "Selamat menempuh hidup baru! Semoga selalu bahagia." }],
      },
      closing: "Terima kasih telah menjadi bagian dari kisah kami.",
      branding: "Undangan oleh kamukamiundang",
    },
  },
  renderer: TemplateSevenRenderer,
};
```

- [ ] **Step 5: Register in the runtime registry**

In `src/features/templates/registry.tsx`, change:

```ts
import { templateSixV1 } from "@/features/templates/template-6/v1/definition";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateRegistry = [
  templateOneV1,
  templateTwoV1,
  templateThreeV1,
  templateFourV1,
  templateFiveV1,
  templateSixV1,
] as const;
```

to:

```ts
import { templateSixV1 } from "@/features/templates/template-6/v1/definition";
import { templateSevenV1 } from "@/features/templates/template-7/v1/definition";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateRegistry = [
  templateOneV1,
  templateTwoV1,
  templateThreeV1,
  templateFourV1,
  templateFiveV1,
  templateSixV1,
  templateSevenV1,
] as const;
```

- [ ] **Step 6: Run the renderer test to confirm it now passes**

Run: `pnpm vitest run src/features/templates/template-7/v1/renderer.test.tsx`
Expected: PASS (all 3 tests).

- [ ] **Step 7: Update `registry.test.ts` for the 7th template**

In `src/features/templates/registry.test.ts`, change:

```ts
    expect(templateRegistry).toHaveLength(6);
```

to:

```ts
    expect(templateRegistry).toHaveLength(7);
```

and change:

```ts
      expect(template.templateKey).toMatch(/^template-[1-6]$/);
```

to:

```ts
      expect(template.templateKey).toMatch(/^template-[1-7]$/);
```

- [ ] **Step 8: Run the registry test suite to confirm it passes**

Run: `pnpm vitest run src/features/templates/registry.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/templates/template-7 src/features/templates/registry.tsx src/features/templates/registry.test.ts
git commit -m "feat(templates): add template-7 Neon Vow renderer and demo content"
```

---

### Task 3: Business metadata bootstrap and asset license entry

**Files:**
- Modify: `src/features/templates/catalog-schema.ts`
- Modify: `docs/templates/licenses.md`

**Interfaces:**
- Consumes: `TemplateCatalogBootstrap` type and `templateCatalogBootstrap` array from `catalog-schema.ts` (existing).
- Produces: a `templateCatalogBootstrap` entry for `template-7:1` that `scripts/reconcile-template-catalog.ts` (via `catalog-reconciliation-core.ts`) will pick up to create a `DRAFT` catalog row.

- [ ] **Step 1: Add the bootstrap entry**

In `src/features/templates/catalog-schema.ts`, add a new object to the end of the `templateCatalogBootstrap` array (after the `template-6` entry, before the closing `];`):

```ts
  {
    templateKey: "template-7",
    templateVersion: 1,
    slug: "neon-vow",
    name: "Neon Vow",
    categoryKey: "modern",
    description: "Editorial berani dengan warna neon lime dan tipografi besar, terinspirasi dari undangan digital Jepang.",
    priceInRupiah: 850000,
    marketingThumbnail: null,
    displayOrder: 70,
  },
```

- [ ] **Step 2: Verify the bootstrap still validates**

Run: `pnpm vitest run src/features/templates/catalog.test.ts`
Expected: PASS (the module-level `templateCatalogBootstrapSchema.parse(catalog)` loop in `catalog-schema.ts` runs at import time — any shape error would throw immediately, failing this test file's import).

- [ ] **Step 3: Add the license entry**

In `docs/templates/licenses.md`, add a row to the "Launch Collection" table (after the `template-3` row):

```markdown
| Template-7 Neon Vow renderer, sticky-reveal layout, SVG orbit/spark ornament, copy, palette tokens | Undango source code | Proprietary, owned by Undango | `template-7` v1 |
```

And add a bullet to "Review Notes":

```markdown
- `template-7` reuses the `cahaya-1.jpg`..`cahaya-4.jpg` stock photo set already used by `template-4`; no new image assets were added for this template.
```

- [ ] **Step 4: Commit**

```bash
git add src/features/templates/catalog-schema.ts docs/templates/licenses.md
git commit -m "docs: register template-7 catalog metadata and license entry"
```

---

### Task 4: Full verification and catalog reconciliation

**Files:** none (verification only; fix forward in already-created files if any check fails).

**Interfaces:** none new.

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: PASS. If it fails on `template-7` files, fix the reported issues in `renderer.tsx`/`definition.ts` and re-run.

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Run the full unit test suite**

Run: `pnpm test`
Expected: PASS, including `src/features/templates/registry.test.ts`, `src/features/templates/template-7/v1/renderer.test.tsx`, and `src/features/templates/catalog.test.ts`.

- [ ] **Step 4: Run the production build**

Run: `pnpm build`
Expected: PASS with no new warnings attributable to `template-7`.

- [ ] **Step 5: Attempt catalog reconciliation (best-effort — requires local Postgres)**

Run: `pnpm templates:reconcile`
Expected: either a JSON report on stdout confirming `template-7:1` was reconciled into a `DRAFT` catalog row, or a connection failure if no local Postgres is running at the `DATABASE_URL` in `.env`. If it fails to connect, do not treat this as a task failure — state explicitly in the final summary that catalog reconciliation was not run because no database was reachable, and that it must be run once a database is available before `template-7` can be made `VISIBLE` from the admin.

- [ ] **Step 6: Manual 360px and reduced-motion spot check**

Run `pnpm dev`, open the template-7 preview route in a browser at a 360px-wide viewport, and confirm: no horizontal scrollbar, the cover button opens the invitation with focus moving to content, and toggling "prefers reduced motion" in devtools leaves the page fully readable (the only animation used, the cover's orbit-line spin, is wrapped in `motion-safe:` so it simply won't run).

- [ ] **Step 7: Final commit (only if Steps 1–4 required fixes)**

```bash
git add -A
git commit -m "fix(templates): address lint/typecheck/test/build feedback for template-7"
```

If no fixes were needed, skip this step — Task 2 and Task 3's commits already cover the final state.
