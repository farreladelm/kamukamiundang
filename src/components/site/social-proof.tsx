import { Reveal } from "@/components/motion/reveal";

const stories = [
  {
    quote:
      "Kami cuma sempat isi form pas malam hari sepulang kerja, dan tiga hari kemudian undangannya sudah bisa dikirim ke grup keluarga besar.",
    name: "Dinda & Bagas",
    detail: "Menikah 9 November 2025, Bandung",
    offset: "sm:translate-y-0",
  },
  {
    quote:
      "Yang paling kami suka, galeri fotonya kebuka cepat walau sinyal tamu di kampung pas-pasan. Beberapa saudara sampai nanya siapa yang desain.",
    name: "Farah & Reyhan",
    detail: "Menikah 22 Maret 2026, Purwokerto",
    offset: "sm:translate-y-10",
  },
  {
    quote:
      "Awalnya ragu karena budget terbatas, tapi hasilnya nggak kelihatan murahan. RSVP-nya juga membantu kami hitung katering dengan lebih akurat.",
    name: "Ayu & Teguh",
    detail: "Menikah 5 Juli 2025, Solo",
    offset: "sm:-translate-y-4",
  },
];

export function SocialProof() {
  return (
    <section id="cerita" className="bg-[#f1ebdd] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">Cerita mereka</p>
          <h2 className="mt-2 max-w-xl font-serif text-4xl text-stone-900 sm:text-5xl">
            Sudah dipakai untuk hari yang tidak akan terulang.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {stories.map((story, index) => (
            <Reveal key={story.name} delay={index * 0.1} className={story.offset}>
              <figure className="flex h-full flex-col rounded-3xl bg-white/80 p-7 shadow-[0_25px_50px_-30px_rgba(41,37,36,0.25)] transition-transform duration-300 hover:-translate-y-1">
                <blockquote className="flex-1 font-serif text-lg leading-relaxed text-stone-800 italic">
                  “{story.quote}”
                </blockquote>
                <figcaption className="mt-6 border-t border-stone-900/10 pt-4">
                  <p className="text-sm font-semibold text-stone-900">{story.name}</p>
                  <p className="text-xs text-stone-500">{story.detail}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
