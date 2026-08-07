export function Footer() {
  return (
    <footer className="border-t border-stone-900/10 bg-[#f1ebdd]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="font-serif text-2xl italic text-stone-900">kamukamiundang</p>
            <p className="mt-3 font-serif text-lg leading-snug text-amber-800 italic">
              Dibuat oleh hati, dengan hati-hati, untuk orang yang selalu ada di hati.
            </p>
            <p className="mt-4 text-sm leading-6 text-stone-600">
              Undangan pernikahan digital yang dirancang dari Yogyakarta, dipakai pasangan di seluruh
              Indonesia.
            </p>
          </div>
          <div className="flex flex-wrap gap-10 sm:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-stone-500 uppercase">Jelajahi</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                <li>
                  <a href="#fitur" className="hover:text-stone-950">
                    Fitur
                  </a>
                </li>
                <li>
                  <a href="#koleksi" className="hover:text-stone-950">
                    Koleksi template
                  </a>
                </li>
                <li>
                  <a href="#cara-kerja" className="hover:text-stone-950">
                    Cara kerja
                  </a>
                </li>
                <li>
                  <a href="#cerita" className="hover:text-stone-950">
                    Cerita mereka
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-stone-950">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-stone-500 uppercase">Kontak</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                <li>
                  <a href="https://wa.me/6282131401640" target="_blank" rel="noreferrer" className="hover:text-stone-950">
                    WhatsApp 0821-3140-1640
                  </a>
                </li>
                <li>
                  <a href="mailto:halo@kamukamiundang.id" className="hover:text-stone-950">
                    halo@kamukamiundang.id
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-stone-900/10 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} kamukamiundang. Untuk hari yang tidak akan pernah terulang.</p>
          <p>Yogyakarta, Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
