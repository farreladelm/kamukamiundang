import { TemplateTwoRenderer } from "@/features/templates/template-2/v1/renderer";
import type { TemplateDefinition } from "@/features/templates/types";

export const templateTwoV1: TemplateDefinition = {
  templateKey: "template-2",
  templateVersion: 1,
  contentSchemaVersion: 2,
  slug: "pesisir-senja",
  name: "Pesisir Senja",
  category: "Modern",
  description: "Modern hangat dengan garis horison, ruang lega, dan warna matahari sore.",
  priceInRupiah: 700000,
  previewStyle: "coast",
  isVisible: true,
  capabilities: ["gallery", "gift", "map", "music", "rsvp", "wishes"],
  palettes: [
    {
      key: "terakota",
      name: "Terakota",
      tokens: { canvas: "#f7e6d3", surface: "#efc7aa", ink: "#33211b", muted: "#78584a", accent: "#bd5d3b", line: "#dcad8d" },
    },
    {
      key: "samudra",
      name: "Samudra",
      tokens: { canvas: "#e1edf0", surface: "#bed8df", ink: "#16333a", muted: "#4b7077", accent: "#1f7180", line: "#95c0c8" },
    },
    {
      key: "tembaga",
      name: "Tembaga",
      tokens: { canvas: "#2d2828", surface: "#433636", ink: "#f6e9d8", muted: "#d5bba1", accent: "#e08252", line: "#6b5550" },
    },
  ],
  demo: {
    paletteKey: "terakota",
    content: {
      eyebrow: "The wedding of",
      cover: { title: "A new horizon", recipientLabel: "Dear", recipientName: "Nama Tamu" },
      couple: { firstName: "Nara", secondName: "Dimas" },
      profiles: [
        {
          name: "Nara Kirana",
          role: "putri",
          parents: "Putri dari Bapak Rendra dan Ibu Maya",
          instagram: "@narakirana",
        },
        {
          name: "Dimas Mahendra",
          role: "putra",
          parents: "Putra dari Bapak Bagus dan Ibu Sinta",
          instagram: "@dimasmahendra",
        },
      ],
      opening: "Dengan sukacita, kami mengundang Anda untuk merayakan awal perjalanan kami bersama.",
      quote: "Kita memilih pulang yang sama, lalu berjalan menuju cakrawala yang baru.",
      eventDate: "Minggu, 6 Desember 2026",
      eventDateIso: "2026-12-06T15:30:00+08:00",
      events: [
        {
          label: "Akad & Pemberkatan",
          date: "Minggu, 6 Desember 2026",
          time: "15.30 WITA",
          venue: "Ruang Ombak, Nusa Dua",
          address: "Jl. Pratama No. 70, Benoa, Bali",
          mapUrl: "https://maps.google.com/?q=Ruang+Ombak+Nusa+Dua",
        },
        {
          label: "Makan Malam",
          date: "Minggu, 6 Desember 2026",
          time: "18.30 WITA",
          venue: "Ruang Ombak, Nusa Dua",
          address: "Jl. Pratama No. 70, Benoa, Bali",
          mapUrl: "https://maps.google.com/?q=Ruang+Ombak+Nusa+Dua",
        },
      ],
      gallery: {
        photos: [
          { id: "nara-01", alt: "Nara dan Dimas di tepi pantai", tone: "sky" },
          { id: "nara-02", alt: "Nara dan Dimas melihat cakrawala", tone: "sand" },
          { id: "nara-03", alt: "Potret pasangan di bawah matahari", tone: "rose" },
          { id: "nara-04", alt: "Momen santai Nara dan Dimas", tone: "sky" },
          { id: "nara-05", alt: "Detail bunga pernikahan", tone: "sand" },
        ],
      },
      gift: {
        intro: "Kehadiran Anda sudah menjadi hadiah. Tanda kasih dapat dikirimkan melalui detail berikut.",
        accounts: [{ bank: "Bank Samudra", accountNumber: "9876 5432 10", accountName: "Nara Kirana" }],
      },
      rsvp: {
        intro: "Mohon konfirmasi kehadiran sebelum 20 November 2026.",
        maxGuests: 2,
      },
      wishes: {
        prompt: "Bagikan doa baik Anda untuk perjalanan kami.",
        entries: [{ name: "Rani & Fajar", message: "Semoga perjalanan baru ini selalu punya cakrawala yang indah." }],
      },
      closing: "Kehadiran dan doa baik Anda akan melengkapi senja paling istimewa bagi kami.",
      branding: "Undangan oleh Undango",
    },
  },
  renderer: TemplateTwoRenderer,
};
