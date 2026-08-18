import { z } from "zod";

export const templateCatalogStatusSchema = z.enum([
  "DRAFT",
  "VISIBLE",
  "HIDDEN",
  "RETIRED",
]);

export const templateCategoryBootstrapSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1),
  displayOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export const templateCatalogBootstrapSchema = z.object({
  templateKey: z.string().trim().min(1),
  templateVersion: z.number().int().nonnegative(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1),
  categoryKey: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(1),
  priceInRupiah: z.number().int().nonnegative(),
  marketingThumbnail: z.string().trim().min(1).nullable(),
  displayOrder: z.number().int().nonnegative(),
});

export type TemplateCategoryBootstrap = z.infer<typeof templateCategoryBootstrapSchema>;
export type TemplateCatalogBootstrap = z.infer<typeof templateCatalogBootstrapSchema>;

export const templateCategoryBootstrap: readonly TemplateCategoryBootstrap[] = [
  { key: "klasik", name: "Klasik", displayOrder: 10, isActive: true },
  { key: "modern", name: "Modern", displayOrder: 20, isActive: true },
  { key: "botanical", name: "Botanical", displayOrder: 30, isActive: true },
  { key: "islami", name: "Islami", displayOrder: 40, isActive: true },
  { key: "elegant", name: "Elegant", displayOrder: 50, isActive: true },
  { key: "minimalis", name: "Minimalis", displayOrder: 60, isActive: true },
];

export const templateCatalogBootstrap: readonly TemplateCatalogBootstrap[] = [
  {
    templateKey: "template-1",
    templateVersion: 1,
    slug: "larasati",
    name: "Larasati",
    categoryKey: "klasik",
    description: "Klasik Jawa yang tenang, dengan ritme editorial dan detail berbingkai.",
    priceInRupiah: 650000,
    marketingThumbnail: null,
    displayOrder: 10,
  },
  {
    templateKey: "template-2",
    templateVersion: 1,
    slug: "pesisir-senja",
    name: "Pesisir Senja",
    categoryKey: "modern",
    description: "Modern hangat dengan garis horison, ruang lega, dan warna matahari sore.",
    priceInRupiah: 700000,
    marketingThumbnail: null,
    displayOrder: 20,
  },
  {
    templateKey: "template-3",
    templateVersion: 1,
    slug: "taman-aksara",
    name: "Taman Aksara",
    categoryKey: "botanical",
    description: "Botanical kontemporer untuk perayaan intim dengan aksara yang lembut.",
    priceInRupiah: 750000,
    marketingThumbnail: null,
    displayOrder: 30,
  },
  {
    templateKey: "template-4",
    templateVersion: 1,
    slug: "cahaya-hati",
    name: "Cahaya Hati",
    categoryKey: "islami",
    description: "Islami yang tenang, dengan lengkung mihrab dan sentuhan emas yang menenangkan.",
    priceInRupiah: 700000,
    marketingThumbnail: null,
    displayOrder: 40,
  },
  {
    templateKey: "template-5",
    templateVersion: 1,
    slug: "ratri-kirana",
    name: "Ratri Kirana",
    categoryKey: "elegant",
    description: "Mewah dan senyap, permainan emas di atas gelap untuk perayaan yang berkesan.",
    priceInRupiah: 950000,
    marketingThumbnail: null,
    displayOrder: 50,
  },
  {
    templateKey: "template-6",
    templateVersion: 1,
    slug: "alinea-baru",
    name: "Alinea Baru",
    categoryKey: "minimalis",
    description: "Minimalis dan lega, tipografi bersih untuk pasangan yang percaya less is more.",
    priceInRupiah: 680000,
    marketingThumbnail: null,
    displayOrder: 60,
  },
  {
    templateKey: "template-7",
    templateVersion: 1,
    slug: "neon-vow",
    name: "Neon Vow",
    categoryKey: "modern",
    description: "Editorial berani dengan warna neon lime dan tipografi besar, terinspirasi dari undangan digital Jepang.",
    priceInRupiah: 850000,
    marketingThumbnail: null,
    displayOrder: 70,
  },
];

for (const category of templateCategoryBootstrap) {
  templateCategoryBootstrapSchema.parse(category);
}

for (const catalog of templateCatalogBootstrap) {
  templateCatalogBootstrapSchema.parse(catalog);
}

export function getCatalogBootstrap(
  templateKey: string,
  templateVersion: number,
): TemplateCatalogBootstrap | undefined {
  return templateCatalogBootstrap.find(
    (catalog) =>
      catalog.templateKey === templateKey && catalog.templateVersion === templateVersion,
  );
}
