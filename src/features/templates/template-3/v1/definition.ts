import { TemplateThreeRenderer } from "@/features/templates/template-3/v1/renderer";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateThreeV1: TemplateRuntimeManifest = {
  templateKey: "template-3",
  templateVersion: 1,
  contentSchemaVersion: 2,
  previewStyle: "garden",
  capabilities: ["gallery", "gift", "map", "rsvp", "story", "wishes"],
  palettes: [
    {
      key: "lumut",
      name: "Lumut",
      tokens: { canvas: "#eaf0e2", surface: "#d5e2ca", ink: "#243228", muted: "#5b705e", accent: "#587145", line: "#aec3a2" },
    },
    {
      key: "mawar",
      name: "Mawar",
      tokens: { canvas: "#f5e8e5", surface: "#eacfc9", ink: "#462c2a", muted: "#845b55", accent: "#a75355", line: "#d7aaa4" },
    },
    {
      key: "arang",
      name: "Arang",
      tokens: { canvas: "#242725", surface: "#363d37", ink: "#f1eee2", muted: "#c5c9b8", accent: "#b4c570", line: "#555e54" },
    },
  ],
  demo: {
    paletteKey: "lumut",
    content: {
      eyebrow: "The wedding of",
      cover: { title: "A garden of two", recipientLabel: "Dear", recipientName: "Nama Tamu" },
      couple: { firstName: "Svara", secondName: "Raka" },
      profiles: [
        {
          name: "Svara Anindita",
          role: "putri",
          parents: "Putri dari Bapak Arif dan Ibu Nita",
          instagram: "@svaraanindita",
        },
        {
          name: "Raka Pradipta",
          role: "putra",
          parents: "Putra dari Bapak Danu dan Ibu Laras",
          instagram: "@rakapradipta",
        },
      ],
      opening: "Dengan hati yang penuh syukur, kami mengundang Anda untuk menjadi bagian dari perayaan kecil kami.",
      quote: "Cinta bertumbuh di antara hal-hal sederhana yang dirawat bersama.",
      eventDate: "Sabtu, 19 Desember 2026",
      eventDateIso: "2026-12-19T10:00:00+07:00",
      events: [
        {
          label: "Pemberkatan",
          date: "Sabtu, 19 Desember 2026",
          time: "10.00 WIB",
          venue: "Rumah Kaca Bumi Sangkuriang",
          address: "Jl. Kiputih No. 12, Bandung",
          mapUrl: "https://maps.google.com/?q=Rumah+Kaca+Bumi+Sangkuriang",
        },
        {
          label: "Jamuan Siang",
          date: "Sabtu, 19 Desember 2026",
          time: "12.30 WIB",
          venue: "Rumah Kaca Bumi Sangkuriang",
          address: "Jl. Kiputih No. 12, Bandung",
          mapUrl: "https://maps.google.com/?q=Rumah+Kaca+Bumi+Sangkuriang",
        },
      ],
      gallery: {
        photos: [
          { id: "svara-01", alt: "Svara dan Raka di kebun", tone: "leaf", src: "/images/stock/taman-2.jpg" },
          { id: "svara-02", alt: "Svara dan Raka membaca bersama", tone: "sand", src: "/images/stock/taman-1.jpg" },
          { id: "svara-03", alt: "Potret pasangan di antara bunga", tone: "rose", src: "/images/stock/taman-4.jpg" },
          { id: "svara-04", alt: "Momen hangat Svara dan Raka", tone: "leaf", src: "/images/stock/taman-2.jpg" },
          { id: "svara-05", alt: "Detail meja pernikahan", tone: "sand", src: "/images/stock/taman-3.jpg" },
          { id: "svara-06", alt: "Svara dan Raka tersenyum", tone: "night", src: "/images/stock/taman-4.jpg" },
        ],
      },
      story: {
        intro: "Dari percakapan kecil, kami belajar merawat sesuatu yang besar.",
        entries: [
          {
            title: "Di antara buku",
            text: "Kami bertemu di antara tumpukan buku dan kopi sore, lalu menemukan bahwa percakapan paling baik selalu memberi ruang untuk bertumbuh.",
            photo: { id: "svara-story-01", alt: "Svara dan Raka membaca buku", tone: "sand", src: "/images/stock/taman-1.jpg" },
          },
          {
            title: "Tumbuh bersama",
            text: "Hari-hari sederhana menjadi tempat kami belajar mendengar, memaafkan, dan memilih satu sama lain.",
            photo: { id: "svara-story-02", alt: "Svara dan Raka berjalan di taman", tone: "leaf", src: "/images/stock/taman-2.jpg" },
          },
        ],
      },
      gift: {
        intro: "Kehadiran dan doa adalah hadiah yang paling kami syukuri. Tanda kasih dapat dikirimkan melalui detail berikut.",
        accounts: [{ bank: "Bank Aksara", accountNumber: "2468 1357 90", accountName: "Svara Anindita" }],
        physicalAddress: "Jl. Kiputih No. 12, Bandung",
      },
      rsvp: {
        intro: "Bantu kami menyiapkan tempat dengan mengonfirmasi kehadiran Anda.",
        maxGuests: 2,
      },
      wishes: {
        prompt: "Tinggalkan ucapan dan doa untuk kami.",
        entries: [{ name: "Dita", message: "Semoga rumah baru kalian selalu dipenuhi cahaya dan ruang untuk bertumbuh." }],
      },
      closing: "Terima kasih telah merawat doa baik untuk hari baru kami.",
      branding: "Undangan oleh kamukamiundang",
    },
  },
  renderer: TemplateThreeRenderer,
};
