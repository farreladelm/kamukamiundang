import { Reveal } from "@/components/motion/reveal";

const rows = [
  { label: "Kirim ke tamu", old: "Broadcast satu per satu, sering ke-skip", ours: "Satu link, tamu buka kapan saja" },
  { label: "Konfirmasi hadir", old: "Dihitung manual dari chat yang bertebaran", ours: "Otomatis tercatat, tinggal dibuka" },
  { label: "Revisi tanggal / lokasi", old: "Cetak ulang atau edit satu-satu", ours: "Sekali edit, langsung berlaku" },
  { label: "Amplop digital", old: "Ketik ulang nomor rekening tiap ditanya", ours: "Tersalin sekali klik" },
  { label: "Tamu luar kota", old: "Kirim lewat pos, kadang telat sampai", ours: "Sampai detik itu juga" },
];

export function Comparison() {
  return (
    <section className="bg-[#f1ebdd] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.16em] text-stone-500 uppercase">Bandingkan</p>
          <h2 className="mt-2 max-w-xl font-serif text-4xl text-stone-900 sm:text-5xl">
            Kenapa bukan cara lama saja.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 overflow-hidden rounded-3xl bg-white shadow-[0_2px_10px_-4px_rgba(41,37,36,0.1)]">
          <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-stone-900/10 text-xs font-semibold tracking-[0.12em] uppercase sm:grid-cols-[1.1fr_1fr_1fr]">
            <div className="px-5 py-4 text-stone-500 sm:px-7">&nbsp;</div>
            <div className="px-5 py-4 text-stone-500 sm:px-7">Cara lama</div>
            <div className="bg-stone-900 px-5 py-4 text-amber-400 sm:px-7">kamukamiundang</div>
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_1fr_1fr] border-b border-stone-900/10 text-sm transition-colors duration-200 last:border-b-0 hover:bg-stone-900/[0.02] sm:grid-cols-[1.1fr_1fr_1fr]"
            >
              <div className="px-5 py-5 font-semibold text-stone-900 sm:px-7">{row.label}</div>
              <div className="px-5 py-5 leading-6 text-stone-500 sm:px-7">{row.old}</div>
              <div className="bg-stone-900/[0.03] px-5 py-5 leading-6 font-medium text-stone-800 sm:px-7">
                {row.ours}
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
