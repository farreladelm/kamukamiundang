import { TemplateSevenRenderer } from "@/features/templates/template-7/v1/renderer";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateSevenV1: TemplateRuntimeManifest = {
  templateKey: "template-7",
  templateVersion: 1,
  contentSchemaVersion: 2,
  previewStyle: "editorial",
  capabilities: ["gallery", "gift", "map", "rsvp", "wishes"],
  palettes: [
    {
      key: "lumen",
      name: "Lumen",
      tokens: { canvas: "#E4FA1F", surface: "#D8ED17", ink: "#15150F", muted: "#3f4025", accent: "#15150F", line: "#c7d419" },
    },
    {
      key: "kelam",
      name: "Kelam",
      tokens: { canvas: "#15150F", surface: "#1f2013", ink: "#E4FA1F", muted: "#9aa15c", accent: "#E4FA1F", line: "#3a3b26" },
    },
    {
      key: "kertas",
      name: "Kertas",
      tokens: { canvas: "#F3F1E4", surface: "#EAE6D2", ink: "#1B1B14", muted: "#5B5C3F", accent: "#5B5C3F", line: "#d8d3ba" },
    },
  ],
  demo: {
    paletteKey: "lumen",
    content: {
      eyebrow: "Undangan pernikahan",
      cover: { title: "With love,", recipientLabel: "Kepada", recipientName: "Nama Tamu" },
      couple: { firstName: "Alika", secondName: "Bregas" },
      profiles: [
        {
          name: "Alika Puspita",
          role: "putri",
          parents: "Putri Bapak Handoko Wibisono dan Ibu Ratna Puspita.",
          instagram: "@alikapuspita",
        },
        {
          name: "Bregas Aditama",
          role: "putra",
          parents: "Putra Bapak Yusuf Aditama dan Ibu Sri Lestari.",
          instagram: "@bregasaditama",
        },
      ],
      opening: "Dengan penuh syukur, kami mengundang Anda merayakan hari yang telah lama kami nantikan.",
      quote: "Cinta yang berani memilih untuk terus bertumbuh, bersama.",
      eventDate: "Minggu, 12 Oktober 2026",
      eventDateIso: "2026-10-12T10:00:00+07:00",
      events: [
        {
          label: "Akad Nikah",
          date: "Minggu, 12 Oktober 2026",
          time: "10.00 - 11.00 WIB",
          venue: "Kudus Convention Hall",
          address: "Jl. Sudirman No. 21, Kudus",
          mapUrl: "https://maps.google.com/?q=Kudus+Convention+Hall",
        },
        {
          label: "Resepsi",
          date: "Minggu, 12 Oktober 2026",
          time: "11.30 - 14.00 WIB",
          venue: "Kudus Convention Hall",
          address: "Jl. Sudirman No. 21, Kudus",
          mapUrl: "https://maps.google.com/?q=Kudus+Convention+Hall",
        },
      ],
      gallery: {
        photos: [
          { id: "alika-01", alt: "Alika dan Bregas di depan gedung bersejarah", tone: "night", src: "/images/stock/cahaya-1.jpg" },
          { id: "alika-02", alt: "Potret dekat Alika dan Bregas", tone: "night", src: "/images/stock/cahaya-2.jpg" },
          { id: "alika-03", alt: "Alika dan Bregas dengan buket bunga putih", tone: "sand", src: "/images/stock/cahaya-3.jpg" },
          { id: "alika-04", alt: "Detail momen Alika dan Bregas", tone: "night", src: "/images/stock/cahaya-4.jpg" },
        ],
      },
      gift: {
        intro: "Doa restu Anda adalah hadiah terbesar. Jika ingin memberi tanda kasih, berikut detailnya.",
        accounts: [{ bank: "Bank Nusantara", accountNumber: "8800 1122 33", accountName: "Alika Puspita" }],
      },
      rsvp: {
        intro: "Mohon konfirmasi kehadiran Anda sebelum 1 Oktober 2026.",
        maxGuests: 3,
      },
      wishes: {
        prompt: "Tinggalkan doa dan ucapan terbaik untuk kami.",
        entries: [{ name: "Sinta & Radit", message: "Selamat menempuh hidup baru! Semoga selalu bahagia." }],
      },
      closing: "Terima kasih telah menjadi bagian dari kisah kami.",
      branding: "Undangan oleh kamukamiundang",
    },
  },
  renderer: TemplateSevenRenderer,
};
