"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { TemplateRendererProps } from "@/features/templates/types";
import { rsvpDemoSchema, rsvpSubmissionSchema, wishDemoSchema } from "@/features/forms/schemas";

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
          alt=""
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
  const ghostOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0.1, 0.03, 0]);
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
      <div className="relative z-10 flex min-h-[130dvh] items-center px-8 py-20 sm:px-16">
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

export function TemplateSevenRenderer({ content, palette, publicInvitationSlug }: TemplateRendererProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [rsvpPending, setRsvpPending] = useState(false);
  const [wishSent, setWishSent] = useState(false);
  const [rsvpErrors, setRsvpErrors] = useState<Record<string, string>>({});
  const [rsvpServerError, setRsvpServerError] = useState<string | null>(null);
  const [wishErrors, setWishErrors] = useState<Record<string, string>>({});

  const rsvpIdempotencyKey = useRef<string | null>(null);

  async function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = publicInvitationSlug
      ? rsvpSubmissionSchema.safeParse({
          name: formData.get("name"),
          attendance: formData.get("attendance"),
          guestCount: formData.get("attendance") === "ATTENDING" ? formData.get("guestCount") : 0,
          eventKeys: formData.get("attendance") === "ATTENDING" ? formData.getAll("eventKeys") : [],
          honeypot: formData.get("honeypot"),
        })
      : rsvpDemoSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!result.success) {
      setRsvpErrors(
        Object.fromEntries(
          Object.entries(result.error.flatten().fieldErrors).map(([field, errors]) => [field, errors?.[0] ?? ""]),
        ),
      );
      return;
    }
    setRsvpErrors({});
    setRsvpServerError(null);
    if (!publicInvitationSlug) {
      setRsvpSent(true);
      return;
    }

    if (!rsvpIdempotencyKey.current) rsvpIdempotencyKey.current = window.crypto.randomUUID();
    setRsvpPending(true);
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(publicInvitationSlug)}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": rsvpIdempotencyKey.current,
        },
        body: JSON.stringify(result.data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: unknown } | null;
        setRsvpServerError(typeof body?.message === "string" ? body.message : "RSVP gagal dikirim.");
        return;
      }
      setRsvpSent(true);
    } catch {
      setRsvpServerError("Koneksi gagal. Silakan coba lagi.");
    } finally {
      setRsvpPending(false);
    }
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
                {publicInvitationSlug ? "Terima kasih, konfirmasi Anda sudah tercatat." : "Terima kasih, konfirmasi Anda sudah tercatat di demo ini."}
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
                   name={publicInvitationSlug ? "guestCount" : "guests"}
                   aria-invalid={Boolean(rsvpErrors.guests || rsvpErrors.guestCount)}
                   aria-describedby={rsvpErrors.guests || rsvpErrors.guestCount ? "rsvp-count-error" : undefined}
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
                {(rsvpErrors.guests || rsvpErrors.guestCount) && (
                  <p id="rsvp-count-error" className="text-xs text-red-800" role="alert">
                    {rsvpErrors.guests || rsvpErrors.guestCount}
                  </p>
                )}
                {publicInvitationSlug && content.rsvp.events && content.rsvp.events.length > 1 && (
                  <fieldset className="grid gap-3 border-0 p-0">
                    <legend className="mb-1 text-xs font-semibold">Acara yang dihadiri</legend>
                    {content.rsvp.events.map((event) => <label key={event.key} className="flex items-center gap-2 text-sm"><input type="checkbox" name="eventKeys" value={event.key} /> {event.label}</label>)}
                    {rsvpErrors.eventKeys && <p className="text-xs text-red-800" role="alert">{rsvpErrors.eventKeys}</p>}
                  </fieldset>
                )}
                {publicInvitationSlug && content.rsvp.events && content.rsvp.events.length === 1 && <input type="hidden" name="eventKeys" value={content.rsvp.events[0].key} />}
                <fieldset className="grid gap-3 border-0 p-0">
                  <legend className="mb-1 text-xs font-semibold">Kehadiran</legend>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="attendance" value={publicInvitationSlug ? "ATTENDING" : "yes"} defaultChecked /> Ya, saya hadir
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="attendance" value={publicInvitationSlug ? "NOT_ATTENDING" : "no"} /> Maaf, saya tidak dapat hadir
                  </label>
                  {publicInvitationSlug && <label className="flex items-center gap-2 text-sm"><input type="radio" name="attendance" value="UNDECIDED" /> Belum menentukan</label>}
                  {rsvpErrors.attendance && (
                    <p className="text-xs text-red-800" role="alert">
                      {rsvpErrors.attendance}
                    </p>
                  )}
                </fieldset>
                {publicInvitationSlug && <input name="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden" />}
                {rsvpServerError && <p className="text-xs text-red-800" role="alert">{rsvpServerError}</p>}
                <button
                  type="submit"
                  disabled={rsvpPending}
                  className="mt-2 min-h-11 border px-4 text-xs font-semibold uppercase tracking-[0.14em] disabled:cursor-wait disabled:opacity-60"
                  style={{ borderColor: palette.tokens.accent }}
                >
                  {rsvpPending ? "Mengirim..." : "Kirim RSVP"}
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
