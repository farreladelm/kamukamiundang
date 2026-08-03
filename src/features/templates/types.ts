import type { ComponentType } from "react";

export type TemplateCapability =
  | "gallery"
  | "gift"
  | "map"
  | "music"
  | "rsvp"
  | "story"
  | "wishes";

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
  cover: {
    title: string;
    recipientLabel: string;
    recipientName: string;
  };
  couple: {
    firstName: string;
    secondName: string;
  };
  profiles: [TemplatePartnerProfile, TemplatePartnerProfile];
  opening: string;
  quote: string;
  eventDate: string;
  eventDateIso: string;
  events: Array<{
    label: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  }>;
  gallery?: TemplateGallery;
  story?: TemplateStory;
  gift?: TemplateGift;
  rsvp?: TemplateRsvp;
  wishes?: TemplateWishes;
  closing: string;
  branding: string;
};

export type TemplatePartnerProfile = {
  name: string;
  role: "putra" | "putri";
  parents: string;
  instagram?: string;
};

export type TemplatePhoto = {
  id: string;
  alt: string;
  tone: "sand" | "rose" | "leaf" | "sky" | "night";
};

export type TemplateGallery = {
  photos: TemplatePhoto[];
  videoLabel?: string;
};

export type TemplateStory = {
  intro?: string;
  entries: Array<{
    title: string;
    text: string;
    photo: TemplatePhoto;
  }>;
};

export type TemplateGift = {
  intro: string;
  accounts: Array<{
    bank: string;
    accountNumber: string;
    accountName: string;
  }>;
  physicalAddress?: string;
};

export type TemplateRsvp = {
  intro: string;
  maxGuests: number;
};

export type TemplateWishes = {
  prompt: string;
  entries: Array<{
    name: string;
    message: string;
  }>;
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
