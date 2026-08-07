import { Reveal } from "@/components/motion/reveal";

const faqs = [
  {
    question: "Berapa lama sampai undangan saya jadi?",
    answer:
      "Setelah kalian isi cerita dan datanya lewat form, kami susun dan kirim link final dalam 1x24 jam kerja.",
  },
  {
    question: "Tamu harus install aplikasi dulu, nggak?",
    answer:
      "Nggak perlu. Undangannya berupa link — tinggal dibuka dari WhatsApp atau browser, langsung jalan di HP tamu.",
  },
  {
    question: "Boleh ganti desain setelah pesan?",
    answer:
      "Sebelum kami mulai kerjakan, boleh. Kalau sudah masuk proses susun, ganti desain berarti mulai dari pesanan baru — jadi pastikan dulu ya sebelum checkout.",
  },
  {
    question: "RSVP dari tamu itu kelihatan di mana?",
    answer:
      "Setiap konfirmasi hadir masuk otomatis ke undangan kalian, tinggal buka linknya untuk lihat rekapnya.",
  },
  {
    question: "Kalau butuh revisi kecil, kena biaya lagi?",
    answer:
      "Revisi teks dan data (nama, tanggal, lokasi) sebelum undangan disebar ke tamu itu gratis. Tinggal WhatsApp kami.",
  },
  {
    question: "Bisa pakai nama domain sendiri?",
    answer:
      "Untuk paket sekarang, undangan kalian pakai link dari kamukamiundang. Kabari kami kalau butuh domain khusus, nanti kami bantu carikan solusinya.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">Pertanyaan</p>
        <h2 className="mt-2 max-w-xl font-serif text-4xl text-stone-900 sm:text-5xl">
          Yang biasanya ditanyakan.
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-x-10 sm:grid-cols-2">
        {faqs.map((faq, index) => (
          <Reveal key={faq.question} delay={(index % 2) * 0.06} className="border-t border-stone-900/10 py-2">
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg text-stone-900 marker:content-none">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-xl text-amber-800 transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">{faq.answer}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
