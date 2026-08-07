"use client";

import { motion } from "framer-motion";

/**
 * A hand-built phone frame previewing a real invitation layout — replaces the
 * old abstract "U in a circle" placeholder with something a visitor can
 * actually judge as a product.
 */
export function InvitationPhone() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <motion.div
        aria-hidden="true"
        className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-[3rem] bg-gradient-to-br from-amber-200/50 via-orange-100/40 to-transparent blur-2xl"
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ rotate: 0, y: -6 }}
        className="relative mx-auto w-[15.5rem] rounded-[2.4rem] border border-stone-900/10 bg-stone-900 p-2 shadow-[0_40px_70px_-30px_rgba(120,53,15,0.45)]"
        style={{ transformOrigin: "bottom center" }}
      >
        <div className="h-6 w-full" aria-hidden="true">
          <div className="mx-auto mt-1.5 h-4 w-20 rounded-full bg-stone-900" />
        </div>
        <div className="overflow-hidden rounded-[1.9rem] border border-stone-900/40 bg-[#f9f5ec]">
          <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-8 text-center">
            <p className="text-[0.6rem] font-semibold tracking-[0.25em] text-amber-800 uppercase">
              Untuk kisah yang dimulai
            </p>
            <div className="flex size-16 items-center justify-center rounded-full border border-amber-800/60 font-serif text-2xl italic text-amber-800">
              R&nbsp;D
            </div>
            <p className="font-serif text-[1.35rem] leading-tight text-stone-900 italic">
              Rani &amp; Dimas
            </p>
            <p className="text-[0.65rem] leading-5 text-stone-600">
              Sabtu, 14 Februari 2027
              <br />
              Yogyakarta
            </p>
            <div className="h-px w-10 bg-amber-800/60" />
            <div className="w-full space-y-2 rounded-2xl bg-white/70 p-3 text-left">
              <div className="h-2 w-3/4 rounded-full bg-stone-900/10" />
              <div className="h-2 w-full rounded-full bg-stone-900/10" />
              <div className="h-2 w-2/3 rounded-full bg-stone-900/10" />
            </div>
            <button
              type="button"
              tabIndex={-1}
              className="pointer-events-none mt-1 inline-flex min-h-9 w-full items-center justify-center rounded-full bg-stone-900 text-[0.7rem] font-semibold text-stone-50"
            >
              Buka undangan
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30, y: 60 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-6 bottom-6 w-40 rotate-6 rounded-2xl border border-stone-900/10 bg-white/90 p-3 shadow-[0_20px_45px_-20px_rgba(41,37,36,0.35)] backdrop-blur sm:-right-10"
      >
        <p className="text-[0.6rem] font-semibold tracking-[0.15em] text-stone-500 uppercase">RSVP masuk</p>
        <p className="mt-1 font-serif text-lg text-stone-900">+142 tamu</p>
        <p className="text-[0.65rem] text-stone-500">konfirmasi hadir</p>
      </motion.div>
    </div>
  );
}
