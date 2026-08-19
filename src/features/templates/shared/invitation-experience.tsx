"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type {
  TemplateContentViewModel,
  TemplatePalette,
  TemplatePhoto,
} from "@/features/templates/types";
import { rsvpDemoSchema, wishDemoSchema } from "@/features/forms/schemas";

type InvitationVariant = "classic" | "coast" | "garden" | "crescent" | "noir" | "line";

type InvitationExperienceProps = {
  content: TemplateContentViewModel;
  palette: TemplatePalette;
  templateName: string;
  variant: InvitationVariant;
  mapLinkLabel: string;
};

const toneColors: Record<TemplatePhoto["tone"], string> = {
  sand: "#c6a37c",
  rose: "#bb7d79",
  leaf: "#718b68",
  sky: "#7397a5",
  night: "#384047",
};

function PlaceholderPhoto({ photo, palette }: { photo: TemplatePhoto; palette: TemplatePalette }) {
  if (photo.src) {
    return (
      <div className="relative min-h-40 overflow-hidden">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 640px) 240px, 50vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={photo.alt}
      className="relative min-h-40 overflow-hidden"
      style={{
        backgroundColor: toneColors[photo.tone],
        backgroundImage: `linear-gradient(145deg, ${palette.tokens.ink}22, transparent 48%), radial-gradient(circle at 70% 22%, ${palette.tokens.canvas}66, transparent 18%)`,
      }}
    >
      <span className="absolute inset-x-5 bottom-4 text-[0.6rem] font-semibold tracking-[0.18em] text-white/75 uppercase">
        Foto pengantin
      </span>
    </div>
  );
}

function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState({ hari: "00", jam: "00", menit: "00", detik: "00" });

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setRemaining(getRemaining(target)), 0);
    const timer = window.setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(timer);
    };
  }, [target]);

  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Hitung mundur menuju hari acara">
      {Object.entries(remaining).map(([unit, value]) => (
        <div key={unit} className="border px-2 py-3 text-center" style={{ borderColor: "currentColor" }}>
          <p className="font-serif text-2xl leading-none">{value}</p>
          <p className="mt-2 text-[0.55rem] font-semibold tracking-[0.16em] uppercase opacity-65">{unit}</p>
        </div>
      ))}
    </div>
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

export function InvitationExperience({
  content,
  palette,
  templateName,
  variant,
  mapLinkLabel,
}: InvitationExperienceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [wishSent, setWishSent] = useState(false);
  const [rsvpErrors, setRsvpErrors] = useState<Record<string, string>>({});
  const [wishErrors, setWishErrors] = useState<Record<string, string>>({});
  const articleRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const scrollContainer = articleRef.current?.closest<HTMLElement>("[data-testid='invitation-scroll']");
    if (!scrollContainer || isOpen) return;

    const previousOverflowY = scrollContainer.style.overflowY;
    scrollContainer.style.overflowY = "hidden";
    return () => {
      scrollContainer.style.overflowY = previousOverflowY;
    };
  }, [isOpen]);

  function openInvitation() {
    setIsOpen(true);
    window.setTimeout(() => contentRef.current?.focus(), 0);
  }

  function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = rsvpDemoSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget).entries()));

    if (!result.success) {
      setRsvpErrors(Object.fromEntries(Object.entries(result.error.flatten().fieldErrors).map(([field, errors]) => [field, errors?.[0] ?? ""])),);
      return;
    }

    setRsvpErrors({});
    setRsvpSent(true);
  }

  function submitWish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = wishDemoSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget).entries()));

    if (!result.success) {
      setWishErrors(Object.fromEntries(Object.entries(result.error.flatten().fieldErrors).map(([field, errors]) => [field, errors?.[0] ?? ""])),);
      return;
    }

    setWishErrors({});
    setWishSent(true);
  }

  async function copyAccount(accountNumber: string) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(accountNumber);
      }
    } catch {
      // Feedback remains useful when clipboard permission is denied.
    }
    setCopiedAccount(accountNumber);
    window.setTimeout(() => setCopiedAccount(null), 2200);
  }

  return (
    <article
      ref={articleRef}
      data-testid="invitation-experience"
      data-invitation-locked={!isOpen}
      className={`invitation-experience invitation-${variant} relative mx-auto max-w-[30rem] overflow-hidden border`}
      style={{
        backgroundColor: palette.tokens.canvas,
        borderColor: palette.tokens.line,
        color: palette.tokens.ink,
      }}
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
          style={{ backgroundColor: palette.tokens.ink, color: palette.tokens.canvas }}
          onWheel={(event) => event.preventDefault()}
          onTouchMove={(event) => event.preventDefault()}
        >
          <div className="pointer-events-none absolute inset-5 border opacity-35" style={{ borderColor: palette.tokens.canvas }} />
          <div className="relative z-10 flex justify-between text-[0.6rem] font-semibold tracking-[0.2em] uppercase opacity-70">
            <span>{templateName}</span>
            <span>Undangan</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-[0.28em] uppercase opacity-70">{content.cover.title}</p>
            <h1 className="mt-6 font-serif text-5xl leading-[0.9] sm:text-6xl">
              {content.couple.firstName} &amp; {content.couple.secondName}
            </h1>
            <p className="mt-8 text-xs tracking-[0.18em] uppercase opacity-70">{content.cover.recipientLabel}</p>
            <p className="mt-2 font-serif text-xl">{content.cover.recipientName}</p>
          </div>
          <div className="relative z-10">
            <button
              type="button"
              className="min-h-12 border px-6 text-xs font-semibold tracking-[0.18em] uppercase transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              style={{ borderColor: palette.tokens.canvas }}
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
          <div className="pointer-events-none absolute inset-0 opacity-45" style={{ background: `linear-gradient(145deg, ${palette.tokens.surface}, transparent 62%)` }} />
          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: palette.tokens.accent }}>
              {content.eyebrow}
            </p>
            <h2 className="mt-5 font-serif text-5xl leading-[0.9] sm:text-6xl">
              {content.couple.firstName} <span className="italic opacity-55">&amp;</span> {content.couple.secondName}
            </h2>
            <p className="mt-7 max-w-xs text-sm leading-7" style={{ color: palette.tokens.muted }}>
              {content.opening}
            </p>
            <p className="mt-8 text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: palette.tokens.accent }}>
              {content.eventDate}
            </p>
          </div>
        </section>

        <section className="border-y px-7 py-14 text-center sm:px-12" style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}>
          <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: palette.tokens.accent }}>
            Sebuah doa
          </p>
          <blockquote className="mx-auto mt-6 max-w-xl font-serif text-2xl leading-relaxed italic sm:text-3xl">
            &ldquo;{content.quote}&rdquo;
          </blockquote>
        </section>

        <section className="px-7 py-14 sm:px-12">
          <SectionHeading eyebrow="Kedua mempelai" title="Dengan penuh kasih" palette={palette} />
          <div className="mt-10 grid gap-10">
            {content.profiles.map((profile) => (
              <div key={profile.name} className="border-b pb-8" style={{ borderColor: palette.tokens.line }}>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: palette.tokens.accent }}>
                  {profile.role}
                </p>
                <h3 className="mt-3 font-serif text-3xl">{profile.name}</h3>
                <p className="mt-3 text-sm leading-6" style={{ color: palette.tokens.muted }}>{profile.parents}</p>
                {profile.instagram && (
                  <a className="mt-4 inline-block text-xs font-semibold tracking-[0.12em] underline underline-offset-4" href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noreferrer">
                    {profile.instagram}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="px-7 py-14 sm:px-12" style={{ backgroundColor: palette.tokens.surface }}>
          <SectionHeading eyebrow="Save the date" title={content.eventDate} palette={palette} />
          <p className="mt-5 text-sm leading-6" style={{ color: palette.tokens.muted }}>Menghitung hari menuju perayaan kecil kami.</p>
            {content.eventDateIso && <div className="mt-8"><Countdown target={content.eventDateIso} /></div>}
        </section>

        <section className="px-7 py-14 sm:px-12">
          <SectionHeading eyebrow="Rangkaian acara" title="Hari yang kami nantikan" palette={palette} />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {content.events.map((event) => (
              <div key={event.label} className="border p-5" style={{ borderColor: palette.tokens.line }}>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: palette.tokens.accent }}>{event.label}</p>
                <p className="mt-5 font-serif text-2xl">{event.time}</p>
                <p className="mt-2 text-sm font-semibold">{event.date}</p>
                <p className="mt-5 font-semibold">{event.venue}</p>
                <p className="mt-1 text-sm leading-6" style={{ color: palette.tokens.muted }}>{event.address}</p>
                {event.mapUrl && <a className="mt-5 inline-block border-b pb-1 text-xs font-semibold" style={{ borderColor: palette.tokens.accent }} href={event.mapUrl} target="_blank" rel="noreferrer">
                  {mapLinkLabel}
                </a>}
              </div>
            ))}
          </div>
        </section>

        {content.rsvp && (
          <section className="border-y px-7 py-14 sm:px-12" style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}>
            <SectionHeading eyebrow="RSVP" title="Sampaikan kehadiran" palette={palette} />
            <p className="mt-5 text-sm leading-6" style={{ color: palette.tokens.muted }}>{content.rsvp.intro}</p>
            {rsvpSent ? (
              <p className="mt-8 border p-4 text-sm" role="status" style={{ borderColor: palette.tokens.accent }}>Terima kasih, konfirmasi Anda sudah tercatat di demo ini.</p>
            ) : (
              <form className="mt-8 grid gap-4" noValidate onSubmit={submitRsvp}>
                 <label className="grid gap-2 text-xs font-semibold" htmlFor="rsvp-name">Nama</label>
                 <input id="rsvp-name" name="name" required aria-invalid={Boolean(rsvpErrors.name)} aria-describedby={rsvpErrors.name ? "rsvp-name-error" : undefined} className="min-h-11 border bg-transparent px-3 text-sm focus-visible:outline-2 aria-[invalid=true]:border-red-700" style={{ borderColor: palette.tokens.line }} />
                 {rsvpErrors.name && <p id="rsvp-name-error" className="text-xs text-red-800" role="alert">{rsvpErrors.name}</p>}
                 <label className="grid gap-2 text-xs font-semibold" htmlFor="rsvp-count">Jumlah tamu</label>
                 <select id="rsvp-count" name="guests" aria-invalid={Boolean(rsvpErrors.guests)} aria-describedby={rsvpErrors.guests ? "rsvp-count-error" : undefined} className="min-h-11 border bg-transparent px-3 text-sm focus-visible:outline-2 aria-[invalid=true]:border-red-700" style={{ borderColor: palette.tokens.line }} defaultValue="1">
                   {Array.from({ length: content.rsvp.maxGuests }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} tamu</option>)}
                 </select>
                 {rsvpErrors.guests && <p id="rsvp-count-error" className="text-xs text-red-800" role="alert">{rsvpErrors.guests}</p>}
                 <fieldset className="grid gap-3 border-0 p-0">
                   <legend className="mb-1 text-xs font-semibold">Kehadiran</legend>
                   <label className="flex items-center gap-2 text-sm"><input type="radio" name="attendance" value="yes" defaultChecked /> Ya, saya hadir</label>
                   <label className="flex items-center gap-2 text-sm"><input type="radio" name="attendance" value="no" /> Maaf, saya tidak dapat hadir</label>
                   {rsvpErrors.attendance && <p className="text-xs text-red-800" role="alert">{rsvpErrors.attendance}</p>}
                 </fieldset>
                <button type="submit" className="mt-2 min-h-11 border px-4 text-xs font-semibold tracking-[0.14em] uppercase" style={{ borderColor: palette.tokens.accent }}>Kirim RSVP</button>
              </form>
            )}
          </section>
        )}

        {content.gallery && (
          <section className="px-7 py-14 sm:px-12">
            <SectionHeading eyebrow="Gallery" title="Potongan hari-hari kami" palette={palette} />
            {content.gallery.videoLabel && <p className="mt-5 border p-4 text-sm" style={{ borderColor: palette.tokens.line }}>{content.gallery.videoLabel} <span className="ml-2 text-xs opacity-65">(placeholder)</span></p>}
            <div className="mt-8 grid grid-cols-2 gap-2">
              {content.gallery.photos.map((photo, index) => <div key={photo.id} className={index === 0 ? "col-span-2" : ""}><PlaceholderPhoto photo={photo} palette={palette} /></div>)}
            </div>
          </section>
        )}

        {content.story && (
          <section className="border-y px-7 py-14 sm:px-12" style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}>
            <SectionHeading eyebrow="Love story" title="Yang membawa kami ke sini" palette={palette} />
            {content.story.intro && <p className="mt-5 text-sm leading-7" style={{ color: palette.tokens.muted }}>{content.story.intro}</p>}
            <div className="mt-10 grid gap-8">
              {content.story.entries.map((entry) => (
                <article key={entry.title}>
                  <PlaceholderPhoto photo={entry.photo} palette={palette} />
                  <h3 className="mt-4 font-serif text-2xl">{entry.title}</h3>
                  <p className="mt-2 text-sm leading-7" style={{ color: palette.tokens.muted }}>{entry.text}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {content.gift && (
          <section className="px-7 py-14 sm:px-12">
            <SectionHeading eyebrow="Wedding gift" title="Tanda kasih" palette={palette} />
            <p className="mt-5 text-sm leading-7" style={{ color: palette.tokens.muted }}>{content.gift.intro}</p>
            <div className="mt-8 grid gap-4">
              {content.gift.accounts.map((account) => (
                <div key={account.accountNumber} className="border p-5" style={{ borderColor: palette.tokens.line }}>
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: palette.tokens.accent }}>{account.bank}</p>
                  <p className="mt-3 font-serif text-xl">{account.accountNumber}</p>
                  <p className="mt-1 text-sm" style={{ color: palette.tokens.muted }}>{account.accountName}</p>
                  <button type="button" className="mt-4 text-xs font-semibold underline underline-offset-4" onClick={() => void copyAccount(account.accountNumber)}>{copiedAccount === account.accountNumber ? "Tersalin" : "Salin nomor rekening"}</button>
                </div>
              ))}
              {content.gift.physicalAddress && <div className="border p-5 text-sm leading-6" style={{ borderColor: palette.tokens.line }}><p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: palette.tokens.accent }}>Kado fisik</p><p className="mt-3" style={{ color: palette.tokens.muted }}>{content.gift.physicalAddress}</p></div>}
            </div>
          </section>
        )}

        {content.wishes && (
          <section className="border-y px-7 py-14 sm:px-12" style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}>
            <SectionHeading eyebrow="Ucapan dan doa" title="Kirimkan kata baik" palette={palette} />
            <p className="mt-5 text-sm leading-6" style={{ color: palette.tokens.muted }}>{content.wishes.prompt}</p>
            <div className="mt-8 grid gap-3">{content.wishes.entries.map((entry) => <blockquote key={entry.name} className="border-l-2 pl-4 text-sm leading-6" style={{ borderColor: palette.tokens.accent }}><p>&ldquo;{entry.message}&rdquo;</p><cite className="mt-2 block text-xs not-italic font-semibold">{entry.name}</cite></blockquote>)}</div>
            {wishSent ? <p className="mt-8 text-sm" role="status">Terima kasih atas ucapan Anda.</p> : <form className="mt-8 grid gap-4" noValidate onSubmit={submitWish}><label className="grid gap-2 text-xs font-semibold" htmlFor="wish-name">Nama</label><input id="wish-name" name="name" required aria-invalid={Boolean(wishErrors.name)} aria-describedby={wishErrors.name ? "wish-name-error" : undefined} className="min-h-11 border bg-transparent px-3 text-sm aria-[invalid=true]:border-red-700" style={{ borderColor: palette.tokens.line }} />{wishErrors.name && <p id="wish-name-error" className="text-xs text-red-800" role="alert">{wishErrors.name}</p>}<label className="grid gap-2 text-xs font-semibold" htmlFor="wish-message">Ucapan</label><textarea id="wish-message" name="message" required maxLength={1000} aria-invalid={Boolean(wishErrors.message)} aria-describedby={wishErrors.message ? "wish-message-error" : undefined} className="min-h-28 border bg-transparent px-3 py-3 text-sm aria-[invalid=true]:border-red-700" style={{ borderColor: palette.tokens.line }} />{wishErrors.message && <p id="wish-message-error" className="text-xs text-red-800" role="alert">{wishErrors.message}</p>}<button type="submit" className="min-h-11 border px-4 text-xs font-semibold tracking-[0.14em] uppercase" style={{ borderColor: palette.tokens.accent }}>Kirim ucapan</button></form>}
          </section>
        )}

        <section className="px-7 py-16 text-center sm:px-12">
          <p className="mx-auto max-w-sm font-serif text-2xl leading-relaxed italic">&ldquo;{content.quote}&rdquo;</p>
          <p className="mx-auto mt-8 max-w-sm text-sm leading-7" style={{ color: palette.tokens.muted }}>{content.closing}</p>
          <p className="mt-8 font-serif text-2xl">{content.couple.firstName} &amp; {content.couple.secondName}</p>
        </section>

        <footer className="px-7 py-8 text-center text-xs" style={{ backgroundColor: palette.tokens.ink, color: palette.tokens.canvas }}>
          {content.branding}
        </footer>
      </main>
    </article>
  );
}

function SectionHeading({ eyebrow, title, palette }: { eyebrow: string; title: string; palette: TemplatePalette }) {
  return (
    <header>
      <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: palette.tokens.accent }}>{eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl leading-tight">{title}</h2>
    </header>
  );
}
