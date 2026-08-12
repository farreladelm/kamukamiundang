import { Reveal } from "@/components/motion/reveal";

/** Small abstract marks in the same thin-stroke language as the template thumbnails — not a generic icon set. */
function MarkRing() {
  return <span aria-hidden="true" className="block size-9 rounded-full border border-amber-800/50" />;
}
function MarkDot() {
  return (
    <span aria-hidden="true" className="flex items-center gap-1.5">
      <span className="size-1.5 rounded-full bg-amber-800/70" />
      <span className="size-1.5 rounded-full bg-amber-800/40" />
      <span className="size-1.5 rounded-full bg-amber-800/20" />
    </span>
  );
}
function MarkLines() {
  return (
    <span aria-hidden="true" className="block space-y-1.5">
      <span className="block h-px w-8 bg-amber-800/60" />
      <span className="block h-px w-5 bg-amber-800/35" />
    </span>
  );
}
function MarkPin() {
  return (
    <span
      aria-hidden="true"
      className="block size-6 rotate-45 rounded-tl-full rounded-tr-full rounded-br-full border border-amber-800/55"
    />
  );
}

export function BentoFeatures() {
  return (
    <section id="fitur" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">Yang kalian dapat</p>
        <h2 className="mt-2 max-w-xl font-serif text-4xl text-stone-900 sm:text-5xl">
          Bukan cuma halaman cantik.
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:grid-rows-2">
        <Reveal className="rounded-3xl bg-white p-8 shadow-[0_2px_10px_-4px_rgba(41,37,36,0.1)] sm:col-span-2 sm:row-span-2">
          <MarkRing />
          <h3 className="mt-6 font-serif text-2xl text-stone-900">RSVP yang beneran kepakai</h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-stone-600">
            Tamu konfirmasi hadir langsung dari undangan, kalian tinggal buka rekap-nya. Nggak perlu
            hitung manual dari chat yang bertebaran di banyak grup.
          </p>
          <div className="mt-8 rounded-2xl border border-stone-900/10 bg-[#f8f4ea] p-5">
            <div className="flex items-center justify-between text-xs font-semibold tracking-[0.1em] text-stone-500 uppercase">
              <span>Konfirmasi hadir</span>
              <span>142 tamu</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-900/10">
              <div className="h-full w-[78%] rounded-full bg-amber-800" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05} className="rounded-3xl bg-white p-7 shadow-[0_2px_10px_-4px_rgba(41,37,36,0.1)]">
          <MarkDot />
          <h3 className="mt-5 font-serif text-xl text-stone-900">Galeri &amp; cerita</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Pajang lebih dari satu foto sampul, sisipkan juga cerita perjalanan kalian berdua.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="rounded-3xl bg-white p-7 shadow-[0_2px_10px_-4px_rgba(41,37,36,0.1)]">
          <MarkLines />
          <h3 className="mt-5 font-serif text-xl text-stone-900">Ucapan &amp; doa</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Tamu bisa titip doa langsung dari undangan, tersimpan rapi buat dibaca lagi nanti.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="rounded-3xl bg-stone-900 p-7 text-stone-50 shadow-[0_2px_10px_-4px_rgba(41,37,36,0.25)]">
          <span aria-hidden="true" className="block text-lg font-serif text-amber-400">Rp</span>
          <h3 className="mt-5 font-serif text-xl">Amplop digital</h3>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Nomor rekening tersalin sekali klik. Kado fisik? Alamatnya juga ada.
          </p>
        </Reveal>

        <Reveal delay={0.2} className="rounded-3xl bg-white p-7 shadow-[0_2px_10px_-4px_rgba(41,37,36,0.1)]">
          <MarkPin />
          <h3 className="mt-5 font-serif text-xl text-stone-900">Peta &amp; musik latar</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Sekali ketuk langsung ke Google Maps, musik latar bikin suasana pas dibuka.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
