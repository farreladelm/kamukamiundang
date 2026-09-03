# Template-7 "Neon Vow" v2 — Motion Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `template-7`'s renderer to drop the click-to-open cover-lock gate (the page is one continuously scrollable panel from load, matching the reference site's interaction model) and replace the v1 CSS-only "sticky reveal" substitute with real scroll-linked motion built on Framer Motion (already an installed, project-convention dependency), per the v2 revision in `docs/superpowers/specs/2026-08-13-template-7-neon-vow-design.md`.

**Architecture:** Full rewrite of `template-7/v1/renderer.tsx` and its test file. No changes to `definition.ts` (demo content/palettes unchanged), `types.ts`, `registry.tsx`, or `catalog-schema.ts` — the interaction/motion model is independent of those. All RSVP/wishes/gift form logic, `Countdown`, `Heading`, `OrbitLine`, `Spark` are carried over unchanged from the current file; a new `Reveal` wrapper (viewport-triggered fade/slide via `whileInView`), `PhotoTitlePanel` (full-bleed photo with scroll-parallax + overlaid title, a new panel not present in v1), and `StickyQuote` (the pin effect, now driven by `useScroll`/`useTransform` instead of static CSS) are added.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Tailwind CSS 4, Framer Motion (`motion`, `useScroll`, `useTransform`, `useReducedMotion` from the `framer-motion` package, already in `package.json`), Vitest + Testing Library.

## Global Constraints

Copied from the v2 revision section of the design spec. These supersede the original spec's cover-lock constraints for `template-7` specifically:

- **No cover-lock.** No click-to-open button, no body-scroll-lock, no `aria-hidden`/`inert` gating of main content, no pre-open `wheel`/`touchmove` `preventDefault`. The page is scrollable from the first paint.
- Cover panel still uses `min-height: 100dvh` (`min-h-[100dvh]`) and still shows the couple names and guest recipient name — it's just not a gate anymore.
- No `wheel`/`touchmove` scroll hijacking anywhere in the file (this constraint continues unchanged — it's just easier to satisfy now that the one place that used it, pre-open cover lock, is gone).
- **Every Framer Motion animated value must be gated behind `useReducedMotion()`.** When reduced motion is requested, elements must render in their final, fully-visible, non-transformed state — never `opacity: 0` or an off-screen transform stuck permanently. The pattern used throughout this plan: default/base state comes from Tailwind classes or absent inline style (always visible), and the animated `style`/`initial`/`whileInView` props are only applied when `reduceMotion` is `false`.
- No horizontal overflow at 360px viewport width — keep `overflow-x-clip` on the root `<article>` (clips the sticky ghost text's `whitespace-nowrap` overflow without blocking vertical/sticky positioning, per the v1 final-review fix).
- No autoplay audio or video.
- External links (Maps, Instagram) use `target="_blank" rel="noreferrer"`.
- The renderer accepts only `{ content, palette }` — no DB/env/request access.
- Optional sections (`gallery`, `gift`, `rsvp`, `wishes`) must not render any wrapper, heading, or spacing when their content field is `undefined`.
- Exactly one heading in the whole document may have the accessible name `"Alika & Bregas"` (the cover `<h1>`) — do not repeat the couple's combined name as a second heading anywhere else (use plain text/paragraphs for the other mentions, as shown below), or `getByRole("heading", { name: ... })` in the test becomes ambiguous.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` (run via `npx pnpm@10 ...` — `pnpm` is not on PATH in this shell) must all pass before the branch is done.
- All demo/prose copy stays in Bahasa Indonesia.

---

### Task 1: Rewrite the renderer with Framer Motion, no cover-lock

**Files:**
- Modify (full replace): `src/features/templates/template-7/v1/renderer.tsx`

**Interfaces:**
- Consumes: `TemplateRendererProps` (unchanged), `rsvpDemoSchema`/`wishDemoSchema` (unchanged), `framer-motion`'s `motion`, `useScroll`, `useTransform`, `useReducedMotion` exports (new).
- Produces: `TemplateSevenRenderer` (same export name, same props — `definition.ts` and `registry.tsx` need no changes).

- [ ] **Step 1: Replace the entire file**

Overwrite `src/features/templates/template-7/v1/renderer.tsx` with exactly this content:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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

/**
 * Viewport-triggered fade/slide reveal. When `reduceMotion` is true, renders
 * with no animation props at all — the wrapped content is simply visible via
 * its own default styles, never stuck at an animated "hidden" state.
 */
function Reveal({
  children,
  reduceMotion,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  reduceMotion: boolean;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Full-bleed photo panel with the couple's name overlaid, echoing the
 * reference site's recurring "title over photo" motif. Parallax is driven
 * by scroll progress local to this panel; gated behind reduceMotion.
 */
function PhotoTitlePanel({
  eyebrow,
  firstName,
  secondName,
  reduceMotion,
}: {
  eyebrow: string;
  firstName: string;
  secondName: string;
  reduceMotion: boolean;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: panelRef, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={panelRef} className="relative min-h-[70dvh] overflow-hidden sm:min-h-[80dvh]">
      <motion.div className="absolute inset-0" style={reduceMotion ? undefined : { y: parallaxY }}>
        <Image
          src="/images/stock/cahaya-2.jpg"
          alt="Potret dekat pasangan"
          fill
          sizes="100vw"
          className="scale-110 object-cover"
        />
      </motion.div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.75))" }}
      />
      <div className="relative z-10 flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-7 text-center sm:min-h-[80dvh]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/85">{eyebrow}</p>
        <p className="font-serif text-[clamp(2.25rem,10vw,3.75rem)] italic leading-[0.9] text-white">
          {firstName} <span className="not-italic text-white/70">&amp;</span> {secondName}
        </p>
      </div>
    </section>
  );
}

/**
 * The reference site's pinned giant-text effect, reproduced with real
 * scroll-linked motion (not v1's static CSS negative-margin overlap): a
 * tall section holds a `position: sticky` ghost-text layer whose
 * opacity/scale respond to local scroll progress, while the quote fades
 * and rises into view over it. No wheel/touch interception — this is pure
 * CSS `sticky` plus scroll-progress-driven style values, so native scroll
 * keeps working throughout.
 */
function StickyQuote({
  eyebrow,
  quote,
  canvas,
  reduceMotion,
}: {
  eyebrow: string;
  quote: string;
  canvas: string;
  reduceMotion: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const ghostOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.3, 0]);
  const ghostScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const quoteOpacity = useTransform(scrollYProgress, [0, 0.3, 0.55], [0, 1, 1]);
  const quoteY = useTransform(scrollYProgress, [0, 0.55], [32, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[230dvh]">
      <div
        className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden"
        aria-hidden="true"
        style={{ backgroundColor: canvas }}
      >
        <motion.span
          className="select-none whitespace-nowrap font-serif text-[26vw] italic leading-none opacity-10"
          style={reduceMotion ? undefined : { opacity: ghostOpacity, scale: ghostScale }}
        >
          {eyebrow}
        </motion.span>
      </div>
      <div className="relative z-10 -mt-[130dvh] flex min-h-[130dvh] items-center px-8 py-20 sm:px-16">
        <motion.blockquote
          className="mx-auto max-w-lg text-center font-serif text-3xl italic leading-relaxed sm:text-4xl"
          style={reduceMotion ? undefined : { opacity: quoteOpacity, y: quoteY }}
        >
          &ldquo;{quote}&rdquo;
        </motion.blockquote>
      </div>
    </section>
  );
}

export function TemplateSevenRenderer({ content, palette }: TemplateRendererProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [wishSent, setWishSent] = useState(false);
  const [rsvpErrors, setRsvpErrors] = useState<Record<string, string>>({});
  const [wishErrors, setWishErrors] = useState<Record<string, string>>({});

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
      className="invitation-experience invitation-editorial relative mx-auto max-w-[30rem] overflow-x-clip border"
      style={{ backgroundColor: palette.tokens.canvas, borderColor: palette.tokens.line, color: palette.tokens.ink }}
    >
      <motion.section
        className="relative flex min-h-[100dvh] flex-col justify-between overflow-hidden px-7 py-10 text-center sm:px-12"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
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
            {content.couple.firstName} <span className="not-italic opacity-60">&amp;</span> {content.couple.secondName}
          </h1>
          <p className="mt-8 text-xs uppercase tracking-[0.2em] opacity-70">{content.cover.recipientLabel}</p>
          <p className="mt-2 font-serif text-xl">{content.cover.recipientName}</p>
        </div>
        <div className="relative z-10">
          <p className="mx-auto max-w-xs text-sm leading-7" style={{ color: palette.tokens.muted }}>
            {content.opening}
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.tokens.accent }}>
            {content.eventDate}
          </p>
        </div>
      </motion.section>

      <PhotoTitlePanel
        eyebrow={content.eyebrow}
        firstName={content.couple.firstName}
        secondName={content.couple.secondName}
        reduceMotion={reduceMotion}
      />

      <StickyQuote
        eyebrow={content.eyebrow}
        quote={content.quote}
        canvas={palette.tokens.canvas}
        reduceMotion={reduceMotion}
      />

      <section className="px-7 py-14 sm:px-12">
        <Reveal reduceMotion={reduceMotion}>
          <Heading eyebrow="Kedua mempelai" title="Dengan penuh kasih" accent={palette.tokens.accent} />
        </Reveal>
        <div className="mt-10 grid gap-10">
          {content.profiles.map((profile, index) => (
            <Reveal
              key={profile.name}
              reduceMotion={reduceMotion}
              delay={index * 0.1}
              className="border-b pb-8"
              style={{ borderColor: palette.tokens.line }}
            >
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
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-7 py-14 sm:px-12" style={{ backgroundColor: palette.tokens.surface }}>
        <Reveal reduceMotion={reduceMotion}>
          <Heading eyebrow="Save the date" title="Menuju hari bahagia" accent={palette.tokens.accent} />
          <p className="mt-8 font-serif text-[clamp(2.5rem,13vw,4.5rem)] italic leading-[0.9]">
            {content.eventDate}
          </p>
          {content.events[0] && (
            <p className="mt-4 text-sm leading-6" style={{ color: palette.tokens.muted }}>
              {content.events[0].venue}
            </p>
          )}
          <div className="mt-8">
            <Countdown target={content.eventDateIso} />
          </div>
        </Reveal>
      </section>

      <section className="px-7 py-14 sm:px-12">
        <Reveal reduceMotion={reduceMotion}>
          <Heading eyebrow="Rangkaian acara" title="Hari yang kami nantikan" accent={palette.tokens.accent} />
        </Reveal>
        <div className="mt-10 grid gap-5">
          {content.events.map((event, index) => (
            <Reveal
              key={event.label}
              reduceMotion={reduceMotion}
              delay={index * 0.1}
              className="border p-5"
              style={{ borderColor: palette.tokens.line }}
            >
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
            </Reveal>
          ))}
        </div>
      </section>

      {content.rsvp && (
        <section className="border-y px-7 py-14 sm:px-12" style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}>
          <Reveal reduceMotion={reduceMotion}>
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
          </Reveal>
        </section>
      )}

      {content.gallery && (
        <section className="px-7 py-14 sm:px-12">
          <Reveal reduceMotion={reduceMotion}>
            <Heading eyebrow="Special thanks" title="Sepenggal momen kami" accent={palette.tokens.accent} />
            <p className="mt-5 text-sm leading-6" style={{ color: palette.tokens.muted }}>
              Terima kasih untuk semua yang telah mendukung kami. Berikut beberapa momen dari hari kami.
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-2">
            {content.gallery.photos.map((photo, index) => (
              <Reveal
                key={photo.id}
                reduceMotion={reduceMotion}
                delay={index * 0.08}
                className={index === 0 ? "relative col-span-2 aspect-[4/3] overflow-hidden" : "relative aspect-square overflow-hidden"}
              >
                {photo.src ? (
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes={index === 0 ? "100vw" : "(min-width: 640px) 240px, 50vw"}
                    className="object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={photo.alt}
                    className="h-full w-full"
                    style={{ backgroundColor: palette.tokens.surface }}
                  />
                )}
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {content.gift && (
        <section className="px-7 py-14 sm:px-12" style={{ backgroundColor: palette.tokens.surface }}>
          <Reveal reduceMotion={reduceMotion}>
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
          </Reveal>
        </section>
      )}

      {content.wishes && (
        <section className="border-y px-7 py-14 sm:px-12" style={{ borderColor: palette.tokens.line }}>
          <Reveal reduceMotion={reduceMotion}>
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
          </Reveal>
        </section>
      )}

      <section className="px-7 py-16 text-center sm:px-12">
        <Reveal reduceMotion={reduceMotion}>
          <p className="mx-auto max-w-sm font-serif text-2xl italic leading-relaxed">&ldquo;{content.quote}&rdquo;</p>
          <p className="mx-auto mt-8 max-w-sm text-sm leading-7" style={{ color: palette.tokens.muted }}>
            {content.closing}
          </p>
          <p className="mt-8 font-serif text-2xl italic">
            {content.couple.firstName} &amp; {content.couple.secondName}
          </p>
        </Reveal>
      </section>

      <footer className="px-7 py-8 text-center text-xs" style={{ backgroundColor: palette.tokens.ink, color: palette.tokens.canvas }}>
        {content.branding}
      </footer>
    </article>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx pnpm@10 typecheck`
Expected: PASS. If Framer Motion's `useScroll`/`useTransform` types complain about the `target` ref type, confirm the refs are declared `useRef<HTMLElement>(null)` (not `HTMLDivElement`) since they're attached to `<section>` elements — this is a common mismatch, fix by matching the ref generic to the actual DOM element type.

- [ ] **Step 3: Commit**

```bash
git add src/features/templates/template-7/v1/renderer.tsx
git commit -m "feat(templates): rewrite template-7 renderer with Framer Motion, drop cover-lock gate"
```

(Do not run the test suite yet — Task 2 rewrites the test file to match. Running the old test file now against this new component will fail because the old test clicks a button that no longer exists; that's expected and handled in Task 2, not a regression to chase here.)

---

### Task 2: Rewrite the renderer test to match the gate-less component

**Files:**
- Modify (full replace): `src/features/templates/template-7/v1/renderer.test.tsx`

**Interfaces:**
- Consumes: `templateSevenV1` from `definition.ts` (unchanged export).
- Produces: nothing new — this is the test suite for Task 1's component.

- [ ] **Step 1: Replace the entire file**

Overwrite `src/features/templates/template-7/v1/renderer.test.tsx` with exactly this content:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateSevenV1 } from "@/features/templates/template-7/v1/definition";

describe("TemplateSevenRenderer", () => {
  afterEach(cleanup);

  it("renders demo content, event details, and a working maps link on initial render", () => {
    const Renderer = templateSevenV1.renderer;

    render(
      <Renderer
        content={templateSevenV1.demo.content}
        palette={templateSevenV1.palettes[0]}
      />,
    );

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
    const { gift, rsvp, wishes, gallery, ...requiredContent } = templateSevenV1.demo.content;

    render(<Renderer content={requiredContent} palette={templateSevenV1.palettes[0]} />);

    expect(screen.queryByRole("heading", { name: "Sampaikan kehadiran" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tanda kasih" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Kirimkan kata baik" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sepenggal momen kami" })).not.toBeInTheDocument();
  });
});
```

Note what changed from the previous version of this file: no `fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }))` call anywhere (that button no longer exists — content is visible on initial render), and the optional-section-omission test now also destructures/asserts `gallery` alongside `gift`/`rsvp`/`wishes`.

- [ ] **Step 2: Run the renderer test**

Run: `npx pnpm@10 vitest run src/features/templates/template-7/v1/renderer.test.tsx`
Expected: PASS (all 3 tests). If the first test fails with "Found multiple elements" for the `"Alika & Bregas"` heading query, that means two headings ended up with that accessible name — check `renderer.tsx` for an accidental second `<h1>`/`<h2>`/etc. bearing the full "firstName & secondName" text; only the cover's `<h1>` should be a heading with that text (the closing section and `PhotoTitlePanel` use plain `<p>` tags for the same text, which is correct and must stay that way).

- [ ] **Step 3: Run the full test suite to confirm nothing else broke**

Run: `npx pnpm@10 test`
Expected: PASS (112/112 — this task doesn't change `registry.tsx`, `catalog-schema.ts`, or the showroom fixture files, so their counts are unaffected).

- [ ] **Step 4: Commit**

```bash
git add src/features/templates/template-7/v1/renderer.test.tsx
git commit -m "test(templates): rewrite template-7 renderer test for gate-less initial render"
```

---

### Task 3: Full verification

**Files:** none (verification only; fix forward in Task 1/2's files if something fails).

**Interfaces:** none new.

- [ ] **Step 1: Lint**

Run: `npx pnpm@10 lint`
Expected: PASS, zero warnings.

- [ ] **Step 2: Typecheck**

Run: `npx pnpm@10 typecheck`
Expected: PASS.

- [ ] **Step 3: Full test suite**

Run: `npx pnpm@10 test`
Expected: PASS, 112/112.

- [ ] **Step 4: Production build**

Run: `npx pnpm@10 build`
Expected: PASS, no new warnings.

- [ ] **Step 5: Static reduced-motion audit**

Read through the final `renderer.tsx` and confirm every `motion.*` element's animated `style`/`initial`/`whileInView`/`animate` prop is conditioned on `reduceMotion` (either `reduceMotion ? false/undefined : {...}` or gated some other way) — there should be no Framer Motion animation prop applied unconditionally. List each one found in your report.

- [ ] **Step 6: Note on catalog reconciliation**

Do not re-run `templates:reconcile` — it was already confirmed blocked by a pre-existing, unrelated `server-only`-import bug in the v1 final review, and nothing in this rewrite touches that code path. No new information would come from re-running it; just note in your report that this is unchanged from the prior finding.

- [ ] **Step 7: Commit (only if Steps 1–4 required fixes)**

```bash
git add -A
git commit -m "fix(templates): address lint/typecheck/test/build feedback for template-7 v2 rewrite"
```

If no fixes were needed, skip this step.
