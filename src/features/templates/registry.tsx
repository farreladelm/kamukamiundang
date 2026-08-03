import { templateOneV1 } from "@/features/templates/template-1/v1/definition";
import type {
  TemplateCatalogItem,
  TemplateDefinition,
  TemplateRendererProps,
} from "@/features/templates/types";

function ConceptRenderer({ content, palette }: TemplateRendererProps) {
  return (
    <article
      className="mx-auto max-w-2xl p-10 text-center"
      style={{ backgroundColor: palette.tokens.canvas, color: palette.tokens.ink }}
    >
      <p className="text-sm tracking-[0.2em] uppercase" style={{ color: palette.tokens.accent }}>
        {content.eyebrow}
      </p>
      <h1 className="mt-6 font-serif text-5xl">
        {content.couple.firstName} &amp; {content.couple.secondName}
      </h1>
      <p className="mt-4" style={{ color: palette.tokens.muted }}>
        {content.eventDate}
      </p>
    </article>
  );
}

const templateTwoV1: TemplateDefinition = {
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
    { key: "terakota", name: "Terakota", tokens: { canvas: "#f7e6d3", surface: "#efc7aa", ink: "#33211b", muted: "#78584a", accent: "#bd5d3b", line: "#dcad8d" } },
    { key: "samudra", name: "Samudra", tokens: { canvas: "#e1edf0", surface: "#bed8df", ink: "#16333a", muted: "#4b7077", accent: "#1f7180", line: "#95c0c8" } },
    { key: "tembaga", name: "Tembaga", tokens: { canvas: "#2d2828", surface: "#433636", ink: "#f6e9d8", muted: "#d5bba1", accent: "#e08252", line: "#6b5550" } },
  ],
  demo: { paletteKey: "terakota", content: { eyebrow: "The wedding of", couple: { firstName: "Nara", secondName: "Dimas" }, opening: "Kami menanti kehadiran Anda.", quote: "Setiap perjalanan indah dimulai dengan memilih arah yang sama.", eventDate: "Minggu, 6 Desember 2026", events: [], story: "", closing: "Sampai jumpa di hari bahagia kami." } },
  renderer: ConceptRenderer,
};

const templateThreeV1: TemplateDefinition = {
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
    { key: "lumut", name: "Lumut", tokens: { canvas: "#eaf0e2", surface: "#d5e2ca", ink: "#243228", muted: "#5b705e", accent: "#587145", line: "#aec3a2" } },
    { key: "mawar", name: "Mawar", tokens: { canvas: "#f5e8e5", surface: "#eacfc9", ink: "#462c2a", muted: "#845b55", accent: "#a75355", line: "#d7aaa4" } },
    { key: "arang", name: "Arang", tokens: { canvas: "#242725", surface: "#363d37", ink: "#f1eee2", muted: "#c5c9b8", accent: "#b4c570", line: "#555e54" } },
  ],
  demo: { paletteKey: "lumut", content: { eyebrow: "The wedding of", couple: { firstName: "Svara", secondName: "Raka" }, opening: "Kami mengundang Anda untuk berbagi doa.", quote: "Cinta bertumbuh di antara hal-hal sederhana yang dirawat bersama.", eventDate: "Sabtu, 19 Desember 2026", events: [], story: "", closing: "Dengan penuh kasih." } },
  renderer: ConceptRenderer,
};

export const templateRegistry = [templateOneV1, templateTwoV1, templateThreeV1] as const;

export function getTemplateDefinition(
  templateKey: string,
  templateVersion: number,
): TemplateDefinition | undefined {
  return templateRegistry.find(
    (template) =>
      template.templateKey === templateKey &&
      template.templateVersion === templateVersion,
  );
}

export function getVisibleTemplateCatalog(): TemplateCatalogItem[] {
  return templateRegistry
    .filter((template) => template.isVisible)
    .map((template) => ({
      templateKey: template.templateKey,
      templateVersion: template.templateVersion,
      slug: template.slug,
      name: template.name,
      category: template.category,
      description: template.description,
      priceInRupiah: template.priceInRupiah,
      previewStyle: template.previewStyle,
      isVisible: template.isVisible,
      palettes: template.palettes,
    }));
}
