import "server-only";

import { db } from "@/lib/server/db";
import { getTemplateRuntimeManifest } from "./registry";
import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nonnegativeInteger = (label: string, negativeMessage: string) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? Number.NaN : value,
  z.coerce.number({ error: label }).int(`${label} harus berupa angka bulat.`).nonnegative(negativeMessage),
);

export const templateCatalogMutationSchema = z.object({
  catalogId: z.string().uuid("Katalog tidak valid."),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(200, "Nama maksimal 200 karakter."),
  description: z.string().trim().min(1, "Deskripsi wajib diisi.").max(5000, "Deskripsi maksimal 5000 karakter."),
  priceInRupiah: nonnegativeInteger("Harga harus berupa angka.", "Harga tidak boleh negatif."),
  categoryId: z.string().uuid("Kategori tidak valid."),
  displayOrder: nonnegativeInteger("Urutan tampil harus berupa angka.", "Urutan tampil tidak boleh negatif."),
  marketingThumbnail: z.preprocess(
    (value) => value === "" ? null : value,
    z.string().trim().url("Thumbnail harus berupa URL yang valid.").max(1000, "URL thumbnail maksimal 1000 karakter.").nullable(),
  ),
  slug: z.string().trim().regex(slugPattern, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung."),
  status: z.enum(["DRAFT", "VISIBLE", "HIDDEN", "RETIRED"], "Status katalog tidak valid."),
});

export type TemplateCatalogMutationInput = z.infer<typeof templateCatalogMutationSchema> & {
  adminId: string;
};

export type TemplateCatalogMutationCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CATEGORY"
  | "SLUG_CONFLICT"
  | "RETIRED"
  | "RUNTIME";

export class TemplateCatalogMutationError extends Error {
  readonly code: TemplateCatalogMutationCode;
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    code: TemplateCatalogMutationCode,
    message: string,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "TemplateCatalogMutationError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

const catalogSelect = {
  id: true,
  templateKey: true,
  templateVersion: true,
  slug: true,
  name: true,
  categoryId: true,
  description: true,
  priceInRupiah: true,
  marketingThumbnail: true,
  displayOrder: true,
  status: true,
  hasBeenVisible: true,
  updatedByAdminId: true,
} as const;

function isUniqueConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : undefined;
  return code === "P2002" || code === "P2010";
}

function validationError(error: z.ZodError): TemplateCatalogMutationError {
  return new TemplateCatalogMutationError(
    "VALIDATION",
    "Periksa kembali data katalog.",
    error.flatten().fieldErrors as Record<string, string[]>,
  );
}

export async function updateTemplateCatalog(input: TemplateCatalogMutationInput) {
  const parsed = templateCatalogMutationSchema.safeParse(input);
  if (!parsed.success) throw validationError(parsed.error);

  try {
    return await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "TemplateCatalog" WHERE "id" = ${parsed.data.catalogId} FOR UPDATE`;
      const catalog = await tx.templateCatalog.findUnique({
        where: { id: parsed.data.catalogId },
        select: catalogSelect,
      });

      if (!catalog) {
        throw new TemplateCatalogMutationError("NOT_FOUND", "Katalog tidak ditemukan.");
      }
      if (catalog.status === "RETIRED" && parsed.data.status !== "RETIRED") {
        throw new TemplateCatalogMutationError(
          "RETIRED",
          "Katalog retired tidak dapat kembali ke status aktif.",
          { status: ["Katalog retired tidak dapat kembali ke status aktif."] },
        );
      }

      const category = await tx.templateCategory.findUnique({
        where: { id: parsed.data.categoryId },
        select: { id: true, isActive: true },
      });
      if (!category || (!category.isActive && category.id !== catalog.categoryId)) {
        throw new TemplateCatalogMutationError(
          "CATEGORY",
          "Kategori tidak tersedia untuk katalog baru.",
          { categoryId: ["Pilih kategori yang aktif."] },
        );
      }
      if (parsed.data.status === "VISIBLE") {
        if (!category.isActive) {
          throw new TemplateCatalogMutationError(
            "CATEGORY",
            "Template visible harus memakai kategori aktif.",
            { categoryId: ["Pilih kategori yang aktif sebelum menampilkan katalog."] },
          );
        }
        if (!getTemplateRuntimeManifest(catalog.templateKey, catalog.templateVersion)) {
          throw new TemplateCatalogMutationError(
            "RUNTIME",
            "Template belum memiliki runtime yang shipped.",
            { status: ["Template belum memiliki runtime yang shipped."] },
          );
        }
      }

      const slugChanged = parsed.data.slug !== catalog.slug;
      if (slugChanged) {
        const canonicalOwner = await tx.templateCatalog.findUnique({
          where: { slug: parsed.data.slug },
          select: { id: true },
        });
        const aliasOwner = await tx.templateSlugAlias.findUnique({
          where: { slug: parsed.data.slug },
          select: { templateCatalogId: true },
        });
        if (canonicalOwner || aliasOwner) {
          throw new TemplateCatalogMutationError(
            "SLUG_CONFLICT",
            "Slug sudah digunakan katalog lain atau menjadi alias historis.",
            { slug: ["Slug sudah digunakan katalog lain atau menjadi alias historis."] },
          );
        }
      }

      const hasBeenVisible = catalog.hasBeenVisible || parsed.data.status === "VISIBLE";
      type AuditScalar = string | number | boolean | null;
      const auditChanges: Record<string, { old: AuditScalar; new: AuditScalar }> = {};
      const metadataChanges = [
        ["slug", catalog.slug, parsed.data.slug],
        ["name", catalog.name, parsed.data.name],
        ["categoryId", catalog.categoryId, parsed.data.categoryId],
        ["description", catalog.description, parsed.data.description],
        ["priceInRupiah", catalog.priceInRupiah, parsed.data.priceInRupiah],
        ["marketingThumbnail", catalog.marketingThumbnail, parsed.data.marketingThumbnail],
        ["displayOrder", catalog.displayOrder, parsed.data.displayOrder],
        ["status", catalog.status, parsed.data.status],
        ["hasBeenVisible", catalog.hasBeenVisible, hasBeenVisible],
      ] as const;
      for (const [field, oldValue, newValue] of metadataChanges) {
        if (oldValue !== newValue) auditChanges[field] = { old: oldValue, new: newValue };
      }

      if (slugChanged && !catalog.hasBeenVisible) {
        await tx.templateSlugAlias.deleteMany({
          where: { templateCatalogId: catalog.id, isCurrent: true },
        });
      }

      if (slugChanged && catalog.hasBeenVisible) {
        await tx.templateSlugAlias.updateMany({
          where: { templateCatalogId: catalog.id, slug: catalog.slug, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      const updated = await tx.templateCatalog.update({
        where: { id: catalog.id },
        data: {
          slug: parsed.data.slug,
          name: parsed.data.name,
          categoryId: parsed.data.categoryId,
          description: parsed.data.description,
          priceInRupiah: parsed.data.priceInRupiah,
          marketingThumbnail: parsed.data.marketingThumbnail,
          displayOrder: parsed.data.displayOrder,
          status: parsed.data.status,
          hasBeenVisible,
          updatedByAdminId: input.adminId,
        },
        select: catalogSelect,
      });

      if (slugChanged) {
        if (catalog.hasBeenVisible) {
          const oldAlias = await tx.templateSlugAlias.findUnique({
            where: { slug: catalog.slug },
            select: { templateCatalogId: true },
          });
          if (!oldAlias) {
            await tx.templateSlugAlias.create({
              data: {
                slug: catalog.slug,
                templateCatalogId: catalog.id,
                isCurrent: false,
              },
            });
          }
        }
        await tx.templateSlugAlias.create({
          data: {
            slug: parsed.data.slug,
            templateCatalogId: catalog.id,
            isCurrent: true,
          },
        });
      }

      await tx.auditEvent.create({
        data: {
          actorType: "ADMIN",
          actorId: input.adminId,
          entityType: "TemplateCatalog",
          entityId: catalog.id,
          action: "UPDATE_METADATA",
          properties: {
            changes: auditChanges,
          },
        },
      });

      return { ...updated, previousSlug: catalog.slug };
    });
  } catch (error) {
    if (error instanceof TemplateCatalogMutationError) throw error;
    if (isUniqueConflict(error)) {
      throw new TemplateCatalogMutationError(
        "SLUG_CONFLICT",
        "Slug sudah digunakan katalog lain atau menjadi alias historis.",
        { slug: ["Slug sudah digunakan katalog lain atau menjadi alias historis."] },
      );
    }
    throw error;
  }
}

export async function listTemplateCatalogAdminPageData() {
  const [catalogs, categories] = await Promise.all([
    db.templateCatalog.findMany({
      orderBy: [{ displayOrder: "asc" }, { templateKey: "asc" }, { templateVersion: "asc" }],
      include: { category: true },
    }),
    db.templateCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, key: true, name: true },
    }),
  ]);

  return {
    catalogs: catalogs.map((catalog) => {
      const runtime = getTemplateRuntimeManifest(catalog.templateKey, catalog.templateVersion);
      return {
        id: catalog.id,
        templateKey: catalog.templateKey,
        templateVersion: catalog.templateVersion,
        slug: catalog.slug,
        name: catalog.name,
        categoryId: catalog.categoryId,
        category: catalog.category,
        description: catalog.description,
        priceInRupiah: catalog.priceInRupiah,
        marketingThumbnail: catalog.marketingThumbnail,
        displayOrder: catalog.displayOrder,
        status: catalog.status,
        updatedAt: catalog.updatedAt.toISOString(),
        runtime: runtime
          ? {
              contentSchemaVersion: runtime.contentSchemaVersion,
              previewStyle: runtime.previewStyle,
              renderer: runtime.renderer.displayName || runtime.renderer.name || "registered renderer",
              capabilities: [...runtime.capabilities],
              palettes: runtime.palettes.map((palette) => ({ key: palette.key, name: palette.name })),
              demo: runtime.demo,
            }
          : null,
      };
    }),
    categories,
  };
}
