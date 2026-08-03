import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateThreeRenderer({
  content,
  palette,
}: TemplateRendererProps) {
  return (
    <article
      className="mx-auto max-w-3xl overflow-hidden border"
      style={{ backgroundColor: palette.tokens.canvas, borderColor: palette.tokens.line, color: palette.tokens.ink }}
    >
      <header className="relative overflow-hidden px-6 py-16 text-center sm:px-16 sm:py-24">
        <div className="pointer-events-none absolute -top-10 -left-8 size-40 rounded-full border" style={{ borderColor: palette.tokens.line }} aria-hidden="true" />
        <div className="pointer-events-none absolute -right-10 -bottom-14 size-48 rounded-full border" style={{ borderColor: palette.tokens.line }} aria-hidden="true" />
        <p className="relative text-xs font-semibold tracking-[0.24em] uppercase" style={{ color: palette.tokens.accent }}>
          {content.eyebrow}
        </p>
        <p className="relative mt-8 font-serif text-xl italic" style={{ color: palette.tokens.muted }}>
          Taman Aksara
        </p>
        <h1 className="relative mt-4 font-serif text-5xl leading-none sm:text-7xl">
          {content.couple.firstName} <span className="italic">&amp;</span> {content.couple.secondName}
        </h1>
        <p className="relative mt-7 text-sm font-semibold tracking-[0.14em] uppercase" style={{ color: palette.tokens.muted }}>
          {content.eventDate}
        </p>
      </header>

      <section className="border-y px-6 py-12 sm:px-16" style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}>
        <p className="mx-auto max-w-2xl text-center leading-7" style={{ color: palette.tokens.muted }}>
          {content.opening}
        </p>
        <p className="mx-auto mt-8 max-w-xl text-center font-serif text-2xl leading-relaxed italic sm:text-3xl">
          &ldquo;{content.quote}&rdquo;
        </p>
      </section>

      <section className="px-6 py-14 sm:px-16 sm:py-20">
        <p className="text-center text-xs font-semibold tracking-[0.24em] uppercase" style={{ color: palette.tokens.accent }}>
          Rangkaian acara
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {content.events.map((event) => (
            <div key={event.label} className="border px-6 py-8 text-center" style={{ borderColor: palette.tokens.line }}>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: palette.tokens.accent }}>
                {event.label}
              </p>
              <p className="mt-4 font-serif text-3xl">{event.time}</p>
              <p className="mt-5 font-semibold">{event.venue}</p>
              <p className="mt-1 leading-6" style={{ color: palette.tokens.muted }}>
                {event.address}
              </p>
              <a
                className="mt-6 inline-block border-b pb-1 text-sm font-semibold"
                style={{ borderColor: palette.tokens.accent, color: palette.tokens.ink }}
                href={event.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                Petunjuk arah
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t px-6 py-14 text-center sm:px-16" style={{ borderColor: palette.tokens.line }}>
        <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: palette.tokens.accent }}>
          Cerita kami
        </p>
        <p className="mx-auto mt-5 max-w-xl leading-7">{content.story}</p>
      </section>

      <footer className="px-6 py-12 text-center" style={{ backgroundColor: palette.tokens.surface }}>
        <p className="mx-auto max-w-xl font-serif text-2xl leading-relaxed">{content.closing}</p>
      </footer>
    </article>
  );
}
