import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateOneRenderer({
  content,
  palette,
}: TemplateRendererProps) {
  return (
    <article
      className="mx-auto max-w-4xl overflow-hidden border"
      style={{
        backgroundColor: palette.tokens.canvas,
        borderColor: palette.tokens.line,
        color: palette.tokens.ink,
      }}
    >
      <header className="px-6 py-16 text-center sm:px-12 sm:py-24">
        <p
          className="text-xs font-semibold tracking-[0.24em] uppercase"
          style={{ color: palette.tokens.accent }}
        >
          {content.eyebrow}
        </p>
        <div
          className="mx-auto mt-8 flex size-28 items-center justify-center rounded-full border text-3xl font-serif italic sm:size-36 sm:text-4xl"
          style={{
            backgroundColor: palette.tokens.surface,
            borderColor: palette.tokens.accent,
            color: palette.tokens.accent,
          }}
          aria-hidden="true"
        >
          A+B
        </div>
        <h1 className="mt-8 font-serif text-5xl leading-none sm:text-7xl">
          {content.couple.firstName} &amp; {content.couple.secondName}
        </h1>
        <p className="mt-5 text-sm tracking-[0.12em] uppercase" style={{ color: palette.tokens.muted }}>
          {content.eventDate}
        </p>
      </header>

      <section
        className="border-y px-6 py-12 text-center sm:px-12"
        style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}
      >
        <p className="mx-auto max-w-xl font-serif text-2xl leading-relaxed italic sm:text-3xl">
          &ldquo;{content.quote}&rdquo;
        </p>
        <p className="mx-auto mt-6 max-w-2xl leading-7" style={{ color: palette.tokens.muted }}>
          {content.opening}
        </p>
      </section>

      <section className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0" style={{ borderColor: palette.tokens.line }}>
        {content.events.map((event) => (
          <div key={event.label} className="px-6 py-10 sm:px-10">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: palette.tokens.accent }}>
              {event.label}
            </p>
            <p className="mt-3 font-serif text-3xl">{event.time}</p>
            <p className="mt-5 font-semibold">{event.venue}</p>
            <p className="mt-1 leading-6" style={{ color: palette.tokens.muted }}>
              {event.address}
            </p>
            <a
              className="mt-6 inline-flex border-b pb-1 text-sm font-semibold"
              style={{ borderColor: palette.tokens.accent, color: palette.tokens.ink }}
              href={event.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Buka Google Maps
            </a>
          </div>
        ))}
      </section>

      <section className="px-6 py-14 text-center sm:px-16">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: palette.tokens.accent }}>
          Catatan kecil kami
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8">{content.story}</p>
      </section>

      <footer className="px-6 py-12 text-center" style={{ backgroundColor: palette.tokens.surface }}>
        <p className="font-serif text-2xl">{content.closing}</p>
      </footer>
    </article>
  );
}
