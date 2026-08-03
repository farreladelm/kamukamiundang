import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateTwoRenderer({
  content,
  palette,
}: TemplateRendererProps) {
  return (
    <article
      className="mx-auto max-w-5xl overflow-hidden"
      style={{ backgroundColor: palette.tokens.canvas, color: palette.tokens.ink }}
    >
      <header className="grid min-h-110 sm:grid-cols-[0.8fr_1.2fr]">
        <div
          className="relative min-h-72 overflow-hidden px-6 py-10 sm:min-h-full sm:px-10"
          style={{ backgroundColor: palette.tokens.accent, color: palette.tokens.canvas }}
        >
          <p className="text-xs font-semibold tracking-[0.24em] uppercase">
            {content.eyebrow}
          </p>
          <div className="absolute right-0 bottom-0 left-0 h-1/3" style={{ backgroundColor: palette.tokens.surface }} />
          <div
            className="absolute right-0 bottom-[22%] left-0 h-px"
            style={{ backgroundColor: palette.tokens.canvas }}
          />
          <p className="absolute right-6 bottom-7 left-6 text-sm leading-6 sm:right-10 sm:left-10">
            {content.opening}
          </p>
        </div>

        <div className="flex flex-col justify-between px-6 py-12 sm:px-14 sm:py-16">
          <p className="text-right text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: palette.tokens.muted }}>
            Pesisir Senja
          </p>
          <div className="py-10 sm:py-16">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase" style={{ color: palette.tokens.accent }}>
              Save the date
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-[0.9] sm:text-7xl">
              {content.couple.firstName} <span className="italic">&amp;</span> {content.couple.secondName}
            </h1>
          </div>
          <p className="text-sm font-semibold tracking-[0.14em] uppercase" style={{ color: palette.tokens.muted }}>
            {content.eventDate}
          </p>
        </div>
      </header>

      <section className="px-6 py-14 sm:px-14 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: palette.tokens.accent }}>
              Sebuah perjalanan
            </p>
            <p className="mt-5 font-serif text-3xl leading-tight italic sm:text-4xl">
              &ldquo;{content.quote}&rdquo;
            </p>
          </div>
          <p className="self-end border-l pl-6 leading-7" style={{ borderColor: palette.tokens.line, color: palette.tokens.muted }}>
            {content.story}
          </p>
        </div>
      </section>

      <section className="border-y" style={{ borderColor: palette.tokens.line, backgroundColor: palette.tokens.surface }}>
        <div className="grid sm:grid-cols-2">
          {content.events.map((event, index) => (
            <div
              key={event.label}
              className="px-6 py-10 sm:px-14 sm:py-14"
              style={index === 0 ? { borderColor: palette.tokens.line } : undefined}
            >
              <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: palette.tokens.accent }}>
                {event.label}
              </p>
              <p className="mt-4 font-serif text-3xl">{event.time}</p>
              <p className="mt-6 font-semibold">{event.venue}</p>
              <p className="mt-1 max-w-sm leading-6" style={{ color: palette.tokens.muted }}>
                {event.address}
              </p>
              <a
                className="mt-6 inline-block text-sm font-semibold underline decoration-1 underline-offset-6"
                style={{ color: palette.tokens.ink, textDecorationColor: palette.tokens.accent }}
                href={event.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                Lihat lokasi
              </a>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-16 text-center sm:py-20">
        <div className="mx-auto h-px w-16" style={{ backgroundColor: palette.tokens.accent }} />
        <p className="mx-auto mt-7 max-w-xl font-serif text-2xl leading-relaxed">{content.closing}</p>
      </footer>
    </article>
  );
}
