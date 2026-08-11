import { TemplateFiveRenderer } from "@/features/templates/template-5/v1/renderer";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateFiveV1: TemplateRuntimeManifest = {
  templateKey: "template-5",
  templateVersion: 1,
  contentSchemaVersion: 2,
  previewStyle: "noir",
  capabilities: ["gallery", "gift", "map", "music", "rsvp", "wishes"],
  palettes: [
    {
      key: "onyx",
      name: "Onyx",
      tokens: { canvas: "#16151a", surface: "#201e26", ink: "#f2ede1", muted: "#b8b0a0", accent: "#cda45e", line: "#3a3742" },
    },
    {
      key: "marun",
      name: "Marun",
      tokens: { canvas: "#241417", surface: "#331b20", ink: "#f3e6e4", muted: "#c2a6a3", accent: "#c98a4b", line: "#4a262c" },
    },
    {
      key: "navi",
      name: "Navi",
      tokens: { canvas: "#12181f", surface: "#1b2531", ink: "#eef1f5", muted: "#a9b4c2", accent: "#c6a35f", line: "#2b3949" },
    },
  ],
  demo: {
    paletteKey: "onyx",
    content: {
      eyebrow: "The wedding celebration of",
      cover: { title: "An evening to remember", recipientLabel: "Dear", recipientName: "Nama Tamu" },
      couple: { firstName: "Kirana", secondName: "Adrian" },
      profiles: [
        {
          name: "Kirana Wibisono",
          role: "putri",
          parents: "Putri dari Bapak Prasetyo Wibisono dan Ibu Anggia Lestari",
          instagram: "@kiranawibisono",
        },
        {
          name: "Adrian Kusuma",
          role: "putra",
          parents: "Putra dari Bapak Hendra Kusuma dan Ibu Meilani Putri",
          instagram: "@adriankusuma",
        },
      ],
      opening: "Dengan penuh sukacita, kami mengundang Bapak, Ibu, Saudara, dan Sahabat untuk hadir merayakan malam istimewa kami.",
      quote: "Cinta yang tenang tidak butuh gemerlap untuk terlihat berharga — ia hanya butuh dua hati yang setia.",
      eventDate: "Sabtu, 21 November 2026",
      eventDateIso: "2026-11-21T18:00:00+07:00",
      events: [
        {
          label: "Resepsi",
          date: "Sabtu, 21 November 2026",
          time: "18.00 - 21.00 WIB",
          venue: "The Grand Ballroom, Hotel Arunika",
          address: "Jl. Sudirman Kav. 21, Jakarta Selatan",
          mapUrl: "https://maps.google.com/?q=Hotel+Arunika+Jakarta",
        },
        {
          label: "Private Dinner",
          date: "Sabtu, 21 November 2026",
          time: "21.00 - 22.00 WIB",
          venue: "The Grand Ballroom, Hotel Arunika",
          address: "Jl. Sudirman Kav. 21, Jakarta Selatan",
          mapUrl: "https://maps.google.com/?q=Hotel+Arunika+Jakarta",
        },
      ],
      gallery: {
        videoLabel: "Putar film pernikahan kami",
        photos: [
          { id: "kirana-01", alt: "Potret Kirana dan Adrian di malam hari", tone: "night", src: "/images/stock/ratri-1.jpg" },
          { id: "kirana-02", alt: "Kirana dan Adrian berdansa", tone: "night", src: "/images/stock/ratri-3.jpg" },
          { id: "kirana-03", alt: "Detail cincin dan buket", tone: "rose", src: "/images/stock/ratri-4.jpg" },
          { id: "kirana-04", alt: "Kirana dan Adrian tersenyum", tone: "sand", src: "/images/stock/ratri-3.jpg" },
          { id: "kirana-05", alt: "Momen romantis di bawah lampu gantung", tone: "night", src: "/images/stock/ratri-2.jpg" },
        ],
      },
      gift: {
        intro: "Kehadiran Anda adalah kehormatan bagi kami. Bila ingin menyampaikan tanda kasih, berikut detailnya.",
        accounts: [{ bank: "Bank Prestige", accountNumber: "5511 2299 00", accountName: "Kirana Wibisono" }],
      },
      rsvp: {
        intro: "Mohon konfirmasi kehadiran Anda sebelum 7 November 2026 agar kami dapat menyiapkan tempat terbaik.",
        maxGuests: 2,
      },
      wishes: {
        prompt: "Sampaikan ucapan dan doa terbaik Anda untuk kami.",
        entries: [{ name: "Bapak & Ibu Wibisono", message: "Selamat menempuh hidup baru, semoga malam ini menjadi awal dari kebahagiaan yang panjang." }],
      },
      closing: "Merupakan suatu kehormatan besar bagi kami apabila Bapak/Ibu/Saudara berkenan hadir di malam istimewa ini.",
      branding: "Undangan oleh kamukamiundang",
    },
  },
  renderer: TemplateFiveRenderer,
};
