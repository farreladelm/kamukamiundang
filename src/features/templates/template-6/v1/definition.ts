import { TemplateSixRenderer } from "@/features/templates/template-6/v1/renderer";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateSixV1: TemplateRuntimeManifest = {
  templateKey: "template-6",
  templateVersion: 1,
  contentSchemaVersion: 2,
  previewStyle: "line",
  capabilities: ["gallery", "gift", "map", "rsvp", "wishes"],
  palettes: [
    {
      key: "kapas",
      name: "Kapas",
      tokens: { canvas: "#f7f6f3", surface: "#ececea", ink: "#1c1c1a", muted: "#666460", accent: "#1c1c1a", line: "#d8d6d1" },
    },
    {
      key: "abu",
      name: "Abu",
      tokens: { canvas: "#f2f3f4", surface: "#e3e5e7", ink: "#21262b", muted: "#626b73", accent: "#3c4650", line: "#cfd4d8" },
    },
    {
      key: "krem",
      name: "Krem",
      tokens: { canvas: "#f5f2ec", surface: "#e8e2d6", ink: "#2a2620", muted: "#6b6458", accent: "#4a4234", line: "#d6cebd" },
    },
  ],
  demo: {
    paletteKey: "kapas",
    content: {
      eyebrow: "Save the date",
      cover: { title: "Together with", recipientLabel: "To", recipientName: "Nama Tamu" },
      couple: { firstName: "Wulan", secondName: "Arya" },
      profiles: [
        {
          name: "Wulan Kartika",
          role: "putri",
          parents: "Putri dari Bapak Slamet Riyadi dan Ibu Dewi Kartika",
          instagram: "@wulankartika",
        },
        {
          name: "Arya Nugroho",
          role: "putra",
          parents: "Putra dari Bapak Wahyu Nugroho dan Ibu Retno Wulandari",
          instagram: "@aryanugroho",
        },
      ],
      opening: "Tanpa banyak kata, kami hanya ingin hari itu dilewati bersama orang-orang yang berarti.",
      quote: "Yang sederhana kadang yang paling tulus.",
      eventDate: "Sabtu, 30 Januari 2027",
      eventDateIso: "2027-01-30T10:00:00+07:00",
      events: [
        {
          label: "Pemberkatan & Resepsi",
          date: "Sabtu, 30 Januari 2027",
          time: "10.00 - 13.00 WIB",
          venue: "Rumah Kayu, Bintaro",
          address: "Jl. Bintaro Utama No. 9, Tangerang Selatan",
          mapUrl: "https://maps.google.com/?q=Rumah+Kayu+Bintaro",
        },
      ],
      gallery: {
        photos: [
          { id: "wulan-01", alt: "Potret Wulan dan Arya", tone: "sand", src: "/images/stock/alinea-1.jpg" },
          { id: "wulan-02", alt: "Wulan dan Arya berjalan santai", tone: "sky", src: "/images/stock/alinea-2.jpg" },
          { id: "wulan-03", alt: "Detail cincin sederhana", tone: "leaf", src: "/images/stock/alinea-4.jpg" },
          { id: "wulan-04", alt: "Wulan dan Arya tertawa bersama", tone: "sand", src: "/images/stock/alinea-3.jpg" },
        ],
      },
      gift: {
        intro: "Kehadiran Anda sudah lebih dari cukup. Bila ingin memberi tanda kasih, berikut detailnya.",
        accounts: [{ bank: "Bank Nusantara", accountNumber: "2200 4488 66", accountName: "Wulan Kartika" }],
      },
      rsvp: {
        intro: "Konfirmasi kehadiran Anda sebelum 20 Januari 2027 akan sangat membantu kami.",
        maxGuests: 2,
      },
      wishes: {
        prompt: "Tinggalkan ucapan singkat untuk kami.",
        entries: [{ name: "Dian & Bagus", message: "Selamat menempuh hidup baru, sederhana tapi selalu bahagia ya." }],
      },
      closing: "Terima kasih sudah menjadi bagian dari cerita kami.",
      branding: "Undangan oleh kamukamiundang",
    },
  },
  renderer: TemplateSixRenderer,
};
