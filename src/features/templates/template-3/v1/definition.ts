import { TemplateThreeRenderer } from "@/features/templates/template-3/v1/renderer";
import type { TemplateDefinition } from "@/features/templates/types";

export const templateThreeV1: TemplateDefinition = {
  templateKey: "template-3",
  templateVersion: 1,
  contentSchemaVersion: 1,
  slug: "taman-aksara",
  name: "Taman Aksara",
  category: "Botanical",
  description: "Botanical kontemporer untuk perayaan intim dengan aksara yang lembut.",
  priceInRupiah: 750000,
  previewStyle: "garden",
  isVisible: true,
  capabilities: ["gallery", "gift", "map", "story"],
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
      couple: { firstName: "Svara", secondName: "Raka" },
      opening: "Dengan hati yang penuh syukur, kami mengundang Anda untuk menjadi bagian dari perayaan kecil kami.",
      quote: "Cinta bertumbuh di antara hal-hal sederhana yang dirawat bersama.",
      eventDate: "Sabtu, 19 Desember 2026",
      events: [
        {
          label: "Pemberkatan",
          time: "10.00 WIB",
          venue: "Rumah Kaca Bumi Sangkuriang",
          address: "Jl. Kiputih No. 12, Bandung",
          mapUrl: "https://maps.google.com/?q=Rumah+Kaca+Bumi+Sangkuriang",
        },
        {
          label: "Jamuan Siang",
          time: "12.30 WIB",
          venue: "Rumah Kaca Bumi Sangkuriang",
          address: "Jl. Kiputih No. 12, Bandung",
          mapUrl: "https://maps.google.com/?q=Rumah+Kaca+Bumi+Sangkuriang",
        },
      ],
      story: "Kami bertemu di antara tumpukan buku dan kopi sore, lalu menemukan bahwa percakapan paling baik selalu memberi ruang untuk bertumbuh.",
      closing: "Terima kasih telah merawat doa baik untuk hari baru kami.",
    },
  },
  renderer: TemplateThreeRenderer,
};
