import { TemplateOneRenderer } from "@/features/templates/template-1/v1/renderer";
import type { TemplateDefinition } from "@/features/templates/types";

export const templateOneV1: TemplateDefinition = {
  templateKey: "template-1",
  templateVersion: 1,
  contentSchemaVersion: 1,
  slug: "larasati",
  name: "Larasati",
  category: "Klasik",
  description: "Klasik Jawa yang tenang, dengan ritme editorial dan detail berbingkai.",
  priceInRupiah: 650000,
  previewStyle: "arch",
  isVisible: true,
  capabilities: ["gallery", "gift", "map", "music", "story"],
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
      couple: { firstName: "Aruna", secondName: "Bima" },
      opening:
        "Dengan penuh syukur, kami mengundang Bapak, Ibu, Saudara, dan Sahabat untuk hadir dalam hari bahagia kami.",
      quote: "Apa yang telah dipersatukan oleh kasih, semoga selalu dikuatkan oleh doa.",
      eventDate: "Sabtu, 14 November 2026",
      events: [
        {
          label: "Akad Nikah",
          time: "08.00 WIB",
          venue: "Pendopo Joglo Sari",
          address: "Jl. Taman Sari No. 18, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Pendopo+Joglo+Sari",
        },
        {
          label: "Resepsi",
          time: "11.00 - 13.00 WIB",
          venue: "Pendopo Joglo Sari",
          address: "Jl. Taman Sari No. 18, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Pendopo+Joglo+Sari",
        },
      ],
      story:
        "Kami dipertemukan oleh sore-sore panjang di kampus, lalu belajar bahwa pulang paling baik adalah berjalan beriringan.",
      closing: "Merupakan kehormatan bagi kami apabila Anda berkenan hadir.",
    },
  },
  renderer: TemplateOneRenderer,
};
