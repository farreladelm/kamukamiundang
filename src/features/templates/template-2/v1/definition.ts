import { TemplateTwoRenderer } from "@/features/templates/template-2/v1/renderer";
import type { TemplateDefinition } from "@/features/templates/types";

export const templateTwoV1: TemplateDefinition = {
  templateKey: "template-2",
  templateVersion: 1,
  contentSchemaVersion: 1,
  slug: "pesisir-senja",
  name: "Pesisir Senja",
  category: "Modern",
  description: "Modern hangat dengan garis horison, ruang lega, dan warna matahari sore.",
  priceInRupiah: 700000,
  previewStyle: "coast",
  isVisible: true,
  capabilities: ["gallery", "gift", "map", "music", "story"],
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
      couple: { firstName: "Nara", secondName: "Dimas" },
      opening: "Dengan sukacita, kami mengundang Anda untuk merayakan awal perjalanan kami bersama.",
      quote: "Kita memilih pulang yang sama, lalu berjalan menuju cakrawala yang baru.",
      eventDate: "Minggu, 6 Desember 2026",
      events: [
        {
          label: "Akad & Pemberkatan",
          time: "15.30 WITA",
          venue: "Ruang Ombak, Nusa Dua",
          address: "Jl. Pratama No. 70, Benoa, Bali",
          mapUrl: "https://maps.google.com/?q=Ruang+Ombak+Nusa+Dua",
        },
        {
          label: "Makan Malam",
          time: "18.30 WITA",
          venue: "Ruang Ombak, Nusa Dua",
          address: "Jl. Pratama No. 70, Benoa, Bali",
          mapUrl: "https://maps.google.com/?q=Ruang+Ombak+Nusa+Dua",
        },
      ],
      story: "Berawal dari percakapan singkat di tepi pantai, kami belajar bahwa tenang selalu terasa lebih dekat saat dibagi berdua.",
      closing: "Kehadiran dan doa baik Anda akan melengkapi senja paling istimewa bagi kami.",
    },
  },
  renderer: TemplateTwoRenderer,
};
