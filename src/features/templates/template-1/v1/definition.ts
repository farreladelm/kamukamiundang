import { TemplateOneRenderer } from "@/features/templates/template-1/v1/renderer";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateOneV1: TemplateRuntimeManifest = {
  templateKey: "template-1",
  templateVersion: 1,
  contentSchemaVersion: 2,
  previewStyle: "arch",
  capabilities: ["gallery", "gift", "map", "music", "story", "rsvp", "wishes"],
  palettes: [
    {
      key: "gading",
      name: "Gading",
      tokens: {
        canvas: "#f6f0e5",
        surface: "#ebe1cf",
        ink: "#302b24",
        muted: "#6a6257",
        accent: "#8a5b3d",
        line: "#cfc0a9",
      },
    },
    {
      key: "soga",
      name: "Soga",
      tokens: {
        canvas: "#f0e7d9",
        surface: "#dfcdb5",
        ink: "#37261d",
        muted: "#6d5140",
        accent: "#865038",
        line: "#c7a88b",
      },
    },
    {
      key: "malam",
      name: "Malam",
      tokens: {
        canvas: "#202827",
        surface: "#2e3937",
        ink: "#f6efe3",
        muted: "#cdc0ad",
        accent: "#d5a86e",
        line: "#57615b",
      },
    },
  ],
  demo: {
    paletteKey: "gading",
    content: {
      eyebrow: "The wedding of",
      cover: { title: "The wedding of", recipientLabel: "Dear", recipientName: "Nama Tamu" },
      couple: { firstName: "Aruna", secondName: "Bima" },
      profiles: [
        {
          name: "Aruna Prameswari",
          role: "putri",
          parents: "Putri dari Bapak Hadi dan Ibu Rani",
          instagram: "@arunapram",
        },
        {
          name: "Bima Adinata",
          role: "putra",
          parents: "Putra dari Bapak Surya dan Ibu Ratih",
          instagram: "@bimaadinata",
        },
      ],
      opening:
        "Dengan penuh syukur, kami mengundang Bapak, Ibu, Saudara, dan Sahabat untuk hadir dalam hari bahagia kami.",
      quote: "Apa yang telah dipersatukan oleh kasih, semoga selalu dikuatkan oleh doa.",
      eventDate: "Sabtu, 14 November 2026",
      eventDateIso: "2026-11-14T08:00:00+07:00",
      events: [
        {
          label: "Akad Nikah",
          date: "Sabtu, 14 November 2026",
          time: "08.00 WIB",
          venue: "Pendopo Joglo Sari",
          address: "Jl. Taman Sari No. 18, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Pendopo+Joglo+Sari",
        },
        {
          label: "Resepsi",
          date: "Sabtu, 14 November 2026",
          time: "11.00 - 13.00 WIB",
          venue: "Pendopo Joglo Sari",
          address: "Jl. Taman Sari No. 18, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Pendopo+Joglo+Sari",
        },
      ],
      gallery: {
        videoLabel: "Putar film kecil kami",
        photos: [
          { id: "aruna-01", alt: "Potret Aruna dan Bima di taman", tone: "leaf", src: "/images/stock/larasati-1.jpg" },
          { id: "aruna-02", alt: "Aruna dan Bima berjalan bersama", tone: "sand", src: "/images/stock/larasati-2.jpg" },
          { id: "aruna-03", alt: "Momen hangat Aruna dan Bima", tone: "rose", src: "/images/stock/larasati-3.jpg" },
          { id: "aruna-04", alt: "Potret pasangan di sore hari", tone: "sky", src: "/images/stock/larasati-1.jpg" },
          { id: "aruna-05", alt: "Aruna dan Bima tersenyum", tone: "night", src: "/images/stock/larasati-2.jpg" },
          { id: "aruna-06", alt: "Detail bunga dan cincin pernikahan", tone: "sand", src: "/images/stock/larasati-4.jpg" },
        ],
      },
      story: {
        intro: "Cerita kecil yang membawa kami sampai ke hari ini.",
        entries: [
          {
            title: "Pertama bertemu",
            text: "Kami dipertemukan oleh sore-sore panjang di kampus, lalu belajar bahwa pulang paling baik adalah berjalan beriringan.",
            photo: { id: "aruna-story-01", alt: "Aruna dan Bima saat pertama bertemu", tone: "sand", src: "/images/stock/larasati-3.jpg" },
          },
          {
            title: "Memilih bersama",
            text: "Dari percakapan sederhana, tumbuh keyakinan untuk saling menjaga dalam setiap musim.",
            photo: { id: "aruna-story-02", alt: "Aruna dan Bima menikmati hari bersama", tone: "rose", src: "/images/stock/larasati-2.jpg" },
          },
        ],
      },
      gift: {
        intro: "Doa dan kehadiran Anda adalah hadiah terindah. Bila ingin berbagi tanda kasih, berikut detailnya.",
        accounts: [{ bank: "Bank Nusantara", accountNumber: "1234 5678 90", accountName: "Aruna Prameswari" }],
        physicalAddress: "Jl. Taman Sari No. 18, Yogyakarta",
      },
      wishes: {
        prompt: "Tuliskan ucapan dan doa untuk kami.",
        entries: [{ name: "Keluarga Prameswari", message: "Selamat menempuh hidup baru. Semoga selalu penuh kasih." }],
      },
      closing: "Merupakan kehormatan bagi kami apabila Anda berkenan hadir.",
      branding: "Undangan oleh kamukamiundang",
    },
  },
  renderer: TemplateOneRenderer,
};
