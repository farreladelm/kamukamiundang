import { TemplateFourRenderer } from "@/features/templates/template-4/v1/renderer";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateFourV1: TemplateRuntimeManifest = {
  templateKey: "template-4",
  templateVersion: 1,
  contentSchemaVersion: 2,
  previewStyle: "crescent",
  capabilities: ["gallery", "gift", "map", "rsvp", "story", "wishes"],
  palettes: [
    {
      key: "zamrud",
      name: "Zamrud",
      tokens: { canvas: "#f3f1e6", surface: "#e4e2c9", ink: "#1f2e26", muted: "#55665c", accent: "#b08a3e", line: "#c9c2a0" },
    },
    {
      key: "nur",
      name: "Nur",
      tokens: { canvas: "#f8f2e2", surface: "#ecdfc0", ink: "#2a2013", muted: "#6b5c3f", accent: "#a9772f", line: "#d8c79c" },
    },
    {
      key: "malam-suci",
      name: "Malam Suci",
      tokens: { canvas: "#16241f", surface: "#1f342c", ink: "#f3ead2", muted: "#c9bfa0", accent: "#d4af6a", line: "#3c554a" },
    },
  ],
  demo: {
    paletteKey: "zamrud",
    content: {
      eyebrow: "Walimatul 'Ursy",
      cover: { title: "Assalamu'alaikum warahmatullahi wabarakatuh", recipientLabel: "Kepada Yth.", recipientName: "Nama Tamu" },
      couple: { firstName: "Salma", secondName: "Rafi" },
      profiles: [
        {
          name: "Salma Nur Azizah",
          role: "putri",
          parents: "Putri dari Bapak Ahmad Zainuri dan Ibu Halimah",
          instagram: "@salmanurazizah",
        },
        {
          name: "Muhammad Rafi Ardiansyah",
          role: "putra",
          parents: "Putra dari Bapak Yusuf Hidayat dan Ibu Siti Aminah",
          instagram: "@rafiardiansyah",
        },
      ],
      opening:
        "Dengan mengucap syukur alhamdulillah, kami bermaksud menyelenggarakan pernikahan dan memohon doa restu Bapak, Ibu, Saudara, dan Sahabat.",
      quote:
        "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup agar kamu merasa tenteram kepadanya. (QS. Ar-Rum: 21)",
      eventDate: "Minggu, 18 Oktober 2026",
      eventDateIso: "2026-10-18T08:00:00+07:00",
      events: [
        {
          label: "Akad Nikah",
          date: "Minggu, 18 Oktober 2026",
          time: "08.00 - 09.30 WIB",
          venue: "Masjid Agung Al-Ikhlas",
          address: "Jl. Kemuning Raya No. 5, Sleman, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Masjid+Agung+Al-Ikhlas+Sleman",
        },
        {
          label: "Resepsi",
          date: "Minggu, 18 Oktober 2026",
          time: "11.00 - 14.00 WIB",
          venue: "Gedung Serbaguna Kemuning",
          address: "Jl. Kemuning Raya No. 5, Sleman, Yogyakarta",
          mapUrl: "https://maps.google.com/?q=Gedung+Serbaguna+Kemuning",
        },
      ],
      gallery: {
        photos: [
          { id: "salma-01", alt: "Potret Salma dan Rafi", tone: "sand", src: "/images/stock/cahaya-1.jpg" },
          { id: "salma-02", alt: "Salma dan Rafi berjalan berdampingan", tone: "leaf", src: "/images/stock/cahaya-3.jpg" },
          { id: "salma-03", alt: "Momen hangat Salma dan Rafi", tone: "night", src: "/images/stock/cahaya-2.jpg" },
          { id: "salma-04", alt: "Detail mahar dan seserahan", tone: "sand", src: "/images/stock/cahaya-4.jpg" },
        ],
      },
      story: {
        intro: "Perjalanan kecil menuju hari yang penuh berkah ini.",
        entries: [
          {
            title: "Dipertemukan",
            text: "Lewat pengajian rutin di kampung, kami saling mengenal dan sama-sama merasa ini bukan kebetulan.",
            photo: { id: "salma-story-01", alt: "Salma dan Rafi saat taaruf", tone: "sand", src: "/images/stock/cahaya-3.jpg" },
          },
          {
            title: "Diikat dalam doa",
            text: "Dengan restu kedua keluarga, kami memantapkan langkah untuk menyempurnakan separuh agama.",
            photo: { id: "salma-story-02", alt: "Salma dan Rafi setelah lamaran", tone: "leaf", src: "/images/stock/cahaya-1.jpg" },
          },
        ],
      },
      gift: {
        intro: "Doa restu Bapak/Ibu/Saudara adalah karunia yang paling berarti bagi kami. Jika berkenan memberi tanda kasih, berikut informasinya.",
        accounts: [{ bank: "Bank Syariah Nusantara", accountNumber: "7300 1122 33", accountName: "Salma Nur Azizah" }],
        physicalAddress: "Jl. Kemuning Raya No. 5, Sleman, Yogyakarta",
      },
      rsvp: {
        intro: "Mohon konfirmasi kehadiran Bapak/Ibu/Saudara sebelum 10 Oktober 2026.",
        maxGuests: 3,
      },
      wishes: {
        prompt: "Titipkan doa terbaik untuk perjalanan rumah tangga kami.",
        entries: [{ name: "Keluarga Besar Al-Ikhlas", message: "Barakallahu laka, semoga menjadi keluarga sakinah, mawaddah, warahmah." }],
      },
      closing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara berkenan hadir dan memberikan doa restu.",
      branding: "Undangan oleh kamukamiundang",
    },
  },
  renderer: TemplateFourRenderer,
};
