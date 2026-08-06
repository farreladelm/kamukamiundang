import { headers } from "next/headers";
import { ShowroomExperience } from "@/features/showroom/showroom-experience";
import { getVisibleTemplateCatalogFromDatabase } from "@/features/templates/visibility";

export default async function ShowroomPage() {
  const templates = await getVisibleTemplateCatalogFromDatabase();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return (
    <main className="bg-[#f7f4ed] text-stone-900">
      <section className="mx-auto grid min-h-[42rem] max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-stone-600 uppercase">Undango / Undangan digital</p>
          <h1 className="mt-7 max-w-3xl font-serif text-5xl leading-[0.94] sm:text-7xl lg:text-8xl">
            Dirancang untuk hari yang ingin selalu diingat.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-stone-700">
            Pilih undangan pernikahan yang terasa personal, lalu isi ceritanya tanpa perlu mendesain dari nol.
          </p>
          <a
            href="#koleksi"
            className="mt-9 inline-flex border-b-2 border-stone-900 pb-2 text-sm font-semibold tracking-[0.08em] uppercase transition-colors hover:border-amber-800 hover:text-amber-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
          >
            Lihat koleksi
          </a>
        </div>
        <div className="relative mx-auto w-full max-w-md border border-stone-300 bg-[#e8ddc9] p-5 sm:p-7">
          <div className="border border-stone-400 bg-[#f9f5ec] px-8 py-14 text-center sm:px-12 sm:py-20">
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-900 uppercase">Untuk kisah yang dimulai</p>
            <div className="mx-auto mt-7 flex size-24 items-center justify-center rounded-full border border-amber-900 font-serif text-3xl italic text-amber-900 sm:size-28">
              U
            </div>
            <p className="mt-8 font-serif text-4xl leading-tight">Sederhana, hangat, dan milik kalian.</p>
            <div className="mx-auto mt-8 h-px w-16 bg-amber-900" />
            <p className="mt-5 text-sm leading-6 text-stone-600">Tiga konsep. Palet terkurasi. Siap dibagikan.</p>
          </div>
        </div>
      </section>
      <div id="koleksi">
        <ShowroomExperience templates={templates} canonicalOrigin={`${protocol}://${host}`} />
      </div>
    </main>
  );
}
