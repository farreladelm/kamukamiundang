import { Reveal } from "@/components/motion/reveal";

const steps = [
  {
    number: "01",
    title: "Pilih desain yang terasa seperti kalian",
    body: "Cek koleksinya, bandingin palet sama gayanya, terus pilih yang paling nyambung sama cerita kalian.",
  },
  {
    number: "02",
    title: "Ceritakan detailnya",
    body: "Isi nama, tanggal, lokasi acara, sama galeri foto lewat formulir yang simpel — nggak perlu sentuh kode atau desain.",
  },
  {
    number: "03",
    title: "Terima link siap dibagikan",
    body: "Kami susun undangannya dengan hati-hati, link finalnya kelar dalam 1x24 jam kerja — tinggal kalian share ke grup keluarga.",
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">Cara kerja</p>
        <h2 className="mt-2 max-w-xl font-serif text-4xl text-stone-900 sm:text-5xl">
          Tiga langkah, dikerjakan dengan hati-hati.
        </h2>
      </Reveal>

      <ol className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-3">
        {steps.map((step, index) => (
          <Reveal key={step.number} delay={index * 0.12} as="li" className="relative">
            <span className="font-serif text-6xl text-amber-800/25">{step.number}</span>
            <h3 className="mt-3 font-serif text-xl text-stone-900">{step.title}</h3>
            <p className="mt-3 max-w-xs text-sm leading-6 text-stone-600">{step.body}</p>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-6 left-[calc(100%+1rem)] hidden h-px w-8 bg-stone-900/15 sm:block"
              />
            )}
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
