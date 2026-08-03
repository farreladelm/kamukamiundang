import type { ComponentType } from "react";

export type TemplateCapability = "gallery" | "gift" | "map" | "music" | "story";

export type TemplatePalette = {
  key: string;
  name: string;
  tokens: {
    canvas: string;
    surface: string;
    ink: string;
    muted: string;
    accent: string;
    line: string;
  };
};

export type TemplateContentViewModel = {
  eyebrow: string;
  couple: {
    firstName: string;
    secondName: string;
  };
  opening: string;
  quote: string;
  eventDate: string;
  events: Array<{
    label: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  }>;
  story: string;
  closing: string;
};

export type TemplateRendererProps = {
  content: TemplateContentViewModel;
  palette: TemplatePalette;
};

export type TemplateDefinition = {
  templateKey: string;
  templateVersion: number;
  contentSchemaVersion: number;
  slug: string;
  name: string;
  category: "Botanical" | "Klasik" | "Modern";
  description: string;
  priceInRupiah: number;
  previewStyle: "arch" | "coast" | "garden";
  isVisible: boolean;
  capabilities: readonly TemplateCapability[];
  palettes: readonly TemplatePalette[];
  demo: {
    paletteKey: string;
    content: TemplateContentViewModel;
  };
  renderer: ComponentType<TemplateRendererProps>;
};

export type TemplateCatalogItem = Pick<
  TemplateDefinition,
  | "templateKey"
  | "templateVersion"
  | "slug"
  | "name"
  | "category"
  | "description"
  | "priceInRupiah"
  | "previewStyle"
  | "isVisible"
  | "palettes"
>;
