"use client";

import { motion } from "framer-motion";

const navLinks = [
  { href: "#fitur", label: "Fitur" },
  { href: "#koleksi", label: "Koleksi" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#cerita", label: "Cerita mereka" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 border-b border-stone-900/5 bg-[#f8f4ea]/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#top" className="font-serif text-xl italic tracking-tight text-stone-900">
          kamukamiundang
        </a>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="https://wa.me/6282131401640"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-stone-900 px-4 text-sm font-semibold text-stone-50 transition-colors hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        >
          Tanya dulu
        </a>
      </div>
    </motion.header>
  );
}
