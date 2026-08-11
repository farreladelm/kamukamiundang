import { headers } from "next/headers";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { InvitationPhone } from "@/components/site/invitation-phone";
import { StatsStrip } from "@/components/site/stats-strip";
import { BentoFeatures } from "@/components/site/bento-features";
import { HowItWorks } from "@/components/site/how-it-works";
import { Comparison } from "@/components/site/comparison";
import { SocialProof } from "@/components/site/social-proof";
import { Faq } from "@/components/site/faq";
import { Reveal } from "@/components/motion/reveal";
import { ShowroomExperience } from "@/features/showroom/showroom-experience";
import { getVisibleTemplateCatalogFromDatabase } from "@/features/templates/visibility";

export default async function ShowroomPage() {
  const templates = await getVisibleTemplateCatalogFromDatabase();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return (
    <div id="top" className="bg-[#f8f4ea] text-stone-900">
      <div className="grain-overlay" aria-hidden="true" />
      <Navbar />
      <main>
        <section className="mx-auto grid max-w-6xl gap-16 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <p className="text-sm font-semibold tracking-[0.18em] text-stone-600 uppercase">
              kamukamiundang / Undangan digital
            </p>
            <h1 className="mt-7 max-w-xl text-5xl leading-[1.02] font-serif text-stone-900 sm:text-6xl lg:text-7xl">
              <span className="text-amber-800 italic">Kami mengundang kamu.</span> Bukan basa-basi.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-stone-700">
              kamukamiundang bantu kalian bikin undangan digital yang personal — mulai dari cerita,
              galeri, sampai RSVP — biar tamu yang buka linknya beneran ngerasa diundang, bukan
              cuma di-forward.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <a
                href="#koleksi"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-stone-900 px-7 text-sm font-semibold tracking-[0.03em] text-stone-50 transition-transform hover:-translate-y-0.5 hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900 active:translate-y-0"
              >
                Lihat koleksi
              </a>
              <a
                href="#cara-kerja"
                className="inline-flex items-center gap-2 border-b-2 border-stone-900/30 pb-1 text-sm font-semibold tracking-[0.03em] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-950"
              >
                Lihat cara kerjanya
              </a>
            </div>
            <p className="mt-12 text-xs font-medium tracking-[0.14em] text-stone-500 uppercase">
              Dipakai pasangan di Yogyakarta &middot; Bandung &middot; Solo &middot; Purwokerto
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <InvitationPhone />
          </Reveal>
        </section>

        <StatsStrip />

        <BentoFeatures />

        <HowItWorks />

        <div id="koleksi" className="scroll-mt-20">
          <ShowroomExperience templates={templates} canonicalOrigin={`${protocol}://${host}`} />
        </div>

        <Comparison />

        <SocialProof />

        <Faq />
      </main>
      <Footer />
    </div>
  );
}
