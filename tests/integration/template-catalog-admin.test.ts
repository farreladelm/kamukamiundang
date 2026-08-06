import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { db } from "@/lib/server/db";
import { updateTemplateCatalogAction } from "@/app/admin/templates/actions";
import {
  createAdminSession,
  ADMIN_SESSION_COOKIE,
} from "@/features/auth/session";
import { reconcileTemplateCatalog } from "@/features/templates/catalog-reconciliation";
import {
  updateTemplateCatalog,
  type TemplateCatalogMutationInput,
} from "@/features/templates/catalog-mutations";

const { redirectMock, revalidatePathMock, cookieToken } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  revalidatePathMock: vi.fn(),
  cookieToken: { value: undefined as string | undefined },
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => name === ADMIN_SESSION_COOKIE && cookieToken.value
      ? { value: cookieToken.value }
      : undefined,
  })),
}));

function formDataFor(input: Record<string, string | number | null>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) {
    formData.set(key, value === null ? "" : String(value));
  }
  return formData;
}

async function catalog(templateKey = "template-1") {
  return db.templateCatalog.findUniqueOrThrow({
    where: { templateKey_templateVersion: { templateKey, templateVersion: 1 } },
    include: { category: true, slugAliases: { orderBy: { createdAt: "asc" } } },
  });
}

async function createCatalogAdmin() {
  const admin = await db.admin.create({
    data: { email: "catalog-admin@example.com", passwordHash: "test-hash" },
  });
  cookieToken.value = await createAdminSession(admin.id);
  return admin;
}

async function mutate(input: Omit<TemplateCatalogMutationInput, "adminId">, adminId: string) {
  return updateTemplateCatalog({ ...input, adminId });
}

beforeEach(async () => {
  cookieToken.value = undefined;
  redirectMock.mockClear();
  revalidatePathMock.mockClear();
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "TemplateSlugAlias", "TemplateCatalog", "AuditEvent", "Session", "Admin" CASCADE',
  );
  await db.templateCategory.updateMany({ data: { isActive: true } });
  await reconcileTemplateCatalog();
  await createCatalogAdmin();
});

describe("admin template catalog metadata", () => {
  it("edits every database-owned field through authenticated admin action", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const target = await catalog();
    const modern = await db.templateCategory.findUniqueOrThrow({ where: { key: "modern" } });

    const result = await updateTemplateCatalogAction(
      undefined,
      formDataFor({
        catalogId: target.id,
        name: "Larasati Kurasi",
        description: "Deskripsi katalog terbaru.",
        priceInRupiah: 825000,
        categoryId: modern.id,
        displayOrder: 7,
        marketingThumbnail: "https://cdn.example/larasati.webp",
        slug: "larasati-kurasi",
        status: "HIDDEN",
      }),
    );

    expect(result.status).toBe("success");
    await expect(catalog()).resolves.toMatchObject({
      name: "Larasati Kurasi",
      description: "Deskripsi katalog terbaru.",
      priceInRupiah: 825000,
      category: { id: modern.id, key: "modern" },
      displayOrder: 7,
      marketingThumbnail: "https://cdn.example/larasati.webp",
      slug: "larasati-kurasi",
      status: "HIDDEN",
      updatedByAdminId: admin.id,
    });
  });

  it("ignores submitted runtime identity, version, schema, palette, capability, and demo fields", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const before = await catalog();
    const input = {
      catalogId: before.id,
      name: "Runtime Safe Name",
      description: before.description,
      priceInRupiah: before.priceInRupiah,
      categoryId: before.categoryId,
      displayOrder: before.displayOrder,
      marketingThumbnail: null,
      slug: before.slug,
      status: "DRAFT" as const,
      templateKey: "attacker-template",
      templateVersion: 999,
      contentSchemaVersion: 999,
      renderer: "attacker-renderer",
      capabilities: ["attacker"],
      palettes: [{ key: "attacker" }],
      demo: { paletteKey: "attacker" },
    } as unknown as Omit<TemplateCatalogMutationInput, "adminId">;

    await mutate(input, admin.id);
    const after = await catalog();

    expect(after.templateKey).toBe(before.templateKey);
    expect(after.templateVersion).toBe(before.templateVersion);
    expect(after.name).toBe("Runtime Safe Name");
    expect(after.status).toBe("DRAFT");
  });

  it("returns field errors for malformed and negative price or display order", async () => {
    const target = await catalog();
    const result = await updateTemplateCatalogAction(
      undefined,
      formDataFor({
        catalogId: target.id,
        name: target.name,
        description: target.description,
        priceInRupiah: "not-a-number",
        categoryId: target.categoryId,
        displayOrder: -1,
        marketingThumbnail: null,
        slug: target.slug,
        status: target.status,
      }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors.priceInRupiah).toBeDefined();
    expect(result.fieldErrors.displayOrder).toBeDefined();
    expect(await catalog()).toMatchObject({ priceInRupiah: target.priceInRupiah, displayOrder: target.displayOrder });
  });

  it("rejects unknown catalog IDs without mutating another catalog", async () => {
    const target = await catalog();
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });

    await expect(mutate({
      catalogId: randomUUID(),
      name: "Tampered",
      description: "Tampered",
      priceInRupiah: 1,
      categoryId: target.categoryId,
      displayOrder: 1,
      marketingThumbnail: null,
      slug: "tampered",
      status: "DRAFT",
    }, admin.id)).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(catalog()).resolves.toMatchObject({ name: target.name, slug: target.slug });
  });

  it.each(["larasati", "historical-larasati"]) (
    "returns inline slug error for duplicate canonical or historical alias (%s)",
    async (slug) => {
      const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
      const target = await catalog("template-2");
      if (slug === "historical-larasati") {
        const owner = await catalog();
        await db.templateSlugAlias.create({ data: { slug, templateCatalogId: owner.id, isCurrent: false } });
      }

      const result = await updateTemplateCatalogAction(
        undefined,
        formDataFor({
          catalogId: target.id,
          name: target.name,
          description: target.description,
          priceInRupiah: target.priceInRupiah,
          categoryId: target.categoryId,
          displayOrder: target.displayOrder,
          marketingThumbnail: null,
          slug,
          status: target.status,
        }),
      );

      expect(result.status).toBe("error");
      expect(result.fieldErrors.slug).toBeDefined();
      expect(await catalog("template-2")).toMatchObject({ slug: "pesisir-senja", name: target.name });
      expect(await db.auditEvent.count({ where: { entityId: target.id } })).toBe(0);
      expect(admin.id).toBeDefined();
    },
  );

  it("replaces current slug alias before first visibility without retaining old slug", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const target = await catalog();

    await mutate({
      catalogId: target.id,
      name: target.name,
      description: target.description,
      priceInRupiah: target.priceInRupiah,
      categoryId: target.categoryId,
      displayOrder: target.displayOrder,
      marketingThumbnail: null,
      slug: "larasati-draft",
      status: "DRAFT",
    }, admin.id);

    expect(await db.templateSlugAlias.findMany({ where: { templateCatalogId: target.id } })).toMatchObject([
      { slug: "larasati-draft", isCurrent: true },
    ]);
    expect(await db.templateSlugAlias.findUnique({ where: { slug: "larasati" } })).toBeNull();
  });

  it("retains old slug as permanent alias after first visibility and marks new slug current", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const target = await catalog();
    const base = {
      catalogId: target.id,
      name: target.name,
      description: target.description,
      priceInRupiah: target.priceInRupiah,
      categoryId: target.categoryId,
      displayOrder: target.displayOrder,
      marketingThumbnail: null,
    };

    await mutate({ ...base, slug: target.slug, status: "VISIBLE" }, admin.id);
    await mutate({ ...base, slug: "larasati-published", status: "HIDDEN" }, admin.id);

    expect(await db.templateSlugAlias.findMany({ where: { templateCatalogId: target.id }, orderBy: { slug: "asc" } })).toMatchObject([
      { slug: "larasati", isCurrent: false },
      { slug: "larasati-published", isCurrent: true },
    ]);
    await expect(catalog()).resolves.toMatchObject({ slug: "larasati-published", hasBeenVisible: true, status: "HIDDEN" });
  });

  it("does not reuse an alias owned by another catalog", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const owner = await catalog();
    const target = await catalog("template-2");
    await db.templateSlugAlias.create({ data: { slug: "owned-history", templateCatalogId: owner.id, isCurrent: false } });

    await expect(mutate({
      catalogId: target.id,
      name: target.name,
      description: target.description,
      priceInRupiah: target.priceInRupiah,
      categoryId: target.categoryId,
      displayOrder: target.displayOrder,
      marketingThumbnail: null,
      slug: "owned-history",
      status: target.status,
    }, admin.id)).rejects.toMatchObject({ code: "SLUG_CONFLICT" });
    await expect(catalog("template-2")).resolves.toMatchObject({ slug: "pesisir-senja" });
  });

  it("supports DRAFT, HIDDEN, VISIBLE, and RETIRED transitions, with RETIRED terminal for visibility", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const target = await catalog();
    const input = {
      catalogId: target.id,
      name: target.name,
      description: target.description,
      priceInRupiah: target.priceInRupiah,
      categoryId: target.categoryId,
      displayOrder: target.displayOrder,
      marketingThumbnail: null,
      slug: target.slug,
    };

    await mutate({ ...input, status: "HIDDEN" }, admin.id);
    await mutate({ ...input, status: "VISIBLE" }, admin.id);
    await mutate({ ...input, status: "HIDDEN" }, admin.id);
    await mutate({ ...input, status: "RETIRED" }, admin.id);
    await expect(mutate({ ...input, status: "VISIBLE" }, admin.id)).rejects.toMatchObject({ code: "RETIRED" });
    await expect(catalog()).resolves.toMatchObject({ status: "RETIRED", hasBeenVisible: true });
  });

  it("requires shipped runtime and valid metadata before making a catalog visible", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const category = await db.templateCategory.findUniqueOrThrow({ where: { key: "klasik" } });
    const target = await db.templateCatalog.create({
      data: {
        templateKey: "not-shipped",
        templateVersion: 1,
        slug: "not-shipped",
        name: "Not Shipped",
        description: "Valid metadata",
        priceInRupiah: 100,
        displayOrder: 99,
        categoryId: category.id,
      },
    });
    await db.templateSlugAlias.create({ data: { slug: target.slug, templateCatalogId: target.id, isCurrent: true } });

    await expect(mutate({
      catalogId: target.id,
      name: target.name,
      description: target.description,
      priceInRupiah: target.priceInRupiah,
      categoryId: category.id,
      displayOrder: target.displayOrder,
      marketingThumbnail: null,
      slug: target.slug,
      status: "VISIBLE",
    }, admin.id)).rejects.toMatchObject({ code: "RUNTIME" });
    await expect(db.templateCatalog.findUniqueOrThrow({ where: { id: target.id } })).resolves.toMatchObject({ status: "DRAFT" });
  });

  it("rejects inactive category for new selection but reads existing historical inactive category", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const inactive = await db.templateCategory.findUniqueOrThrow({ where: { key: "modern" } });
    await db.templateCategory.update({ where: { id: inactive.id }, data: { isActive: false } });
    try {
      const historical = await catalog();
      await db.templateCatalog.update({ where: { id: historical.id }, data: { categoryId: inactive.id } });

      await expect(mutate({
        catalogId: historical.id,
        name: "Historical Category Catalog",
        description: historical.description,
        priceInRupiah: historical.priceInRupiah,
        categoryId: inactive.id,
        displayOrder: historical.displayOrder,
        marketingThumbnail: null,
        slug: historical.slug,
        status: "DRAFT",
      }, admin.id)).resolves.toMatchObject({ categoryId: inactive.id });

      const target = await catalog("template-3");
      await expect(mutate({
        catalogId: target.id,
        name: target.name,
        description: target.description,
        priceInRupiah: target.priceInRupiah,
        categoryId: inactive.id,
        displayOrder: target.displayOrder,
        marketingThumbnail: null,
        slug: target.slug,
        status: "DRAFT",
      }, admin.id)).rejects.toMatchObject({ code: "CATEGORY" });
    } finally {
      await db.templateCategory.update({ where: { id: inactive.id }, data: { isActive: true } });
    }
  });

  it("updates admin attribution and writes exactly one audit event atomically", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const target = await catalog();
    await mutate({
      catalogId: target.id,
      name: "Audited Catalog",
      description: target.description,
      priceInRupiah: target.priceInRupiah,
      categoryId: target.categoryId,
      displayOrder: target.displayOrder,
      marketingThumbnail: null,
      slug: target.slug,
      status: target.status,
    }, admin.id);

    await expect(db.templateCatalog.findUniqueOrThrow({ where: { id: target.id } })).resolves.toMatchObject({ updatedByAdminId: admin.id });
    await expect(db.auditEvent.findMany({ where: { entityId: target.id } })).resolves.toMatchObject([
      {
        action: "UPDATE_METADATA",
        properties: {
          changes: {
            name: { old: target.name, new: "Audited Catalog" },
          },
        },
      },
    ]);
  });

  it("writes no audit or partial catalog/alias update when mutation fails", async () => {
    const admin = await db.admin.findUniqueOrThrow({ where: { email: "catalog-admin@example.com" } });
    const target = await catalog();
    const beforeAliases = await db.templateSlugAlias.findMany({ where: { templateCatalogId: target.id } });

    await expect(mutate({
      catalogId: target.id,
      name: "Should Roll Back",
      description: target.description,
      priceInRupiah: target.priceInRupiah,
      categoryId: target.categoryId,
      displayOrder: target.displayOrder,
      marketingThumbnail: null,
      slug: "pesisir-senja",
      status: target.status,
    }, admin.id)).rejects.toMatchObject({ code: "SLUG_CONFLICT" });

    await expect(catalog()).resolves.toMatchObject({ name: target.name, slug: target.slug, updatedByAdminId: null });
    await expect(db.templateSlugAlias.findMany({ where: { templateCatalogId: target.id } })).resolves.toEqual(beforeAliases);
    await expect(db.auditEvent.count({ where: { entityId: target.id } })).resolves.toBe(0);
  });

  it("redirects unauthenticated Server Action to admin login before mutation", async () => {
    cookieToken.value = undefined;
    const target = await catalog();
    await expect(updateTemplateCatalogAction(
      undefined,
      formDataFor({
        catalogId: target.id,
        name: "No Access",
        description: target.description,
        priceInRupiah: target.priceInRupiah,
        categoryId: target.categoryId,
        displayOrder: target.displayOrder,
        marketingThumbnail: null,
        slug: target.slug,
        status: target.status,
      }),
    )).rejects.toThrow("REDIRECT:/auth/admin?reason=session-expired");
  });

  it("serializes concurrent canonical and alias claims for one slug", async () => {
    const first = await catalog();
    const second = await catalog("template-2");
    const originalSlug = first.slug;
    const slug = `concurrent-${randomUUID().slice(0, 8)}`;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL must be set");
    const firstClient = new Client({ connectionString });
    const secondClient = new Client({ connectionString });
    let firstCommitted = false;
    let secondOpen = false;
    try {
      await Promise.all([firstClient.connect(), secondClient.connect()]);
      await firstClient.query("BEGIN");
      await firstClient.query('UPDATE "TemplateCatalog" SET "slug" = $1 WHERE "id" = $2', [slug, first.id]);

      await secondClient.query("BEGIN");
      secondOpen = true;
      await secondClient.query("SET LOCAL lock_timeout = '250ms'");
      let claimError: { code?: string } | undefined;
      try {
        // Before advisory-lock migration this statement succeeds while A remains open.
        await secondClient.query(
          'INSERT INTO "TemplateSlugAlias" ("id", "slug", "templateCatalogId", "isCurrent") VALUES ($1, $2, $3, false)',
          [randomUUID(), slug, second.id],
        );
      } catch (error) {
        claimError = error as { code?: string };
      }
      expect(claimError?.code).toBe("55P03");
      await secondClient.query("ROLLBACK");
      secondOpen = false;
      await firstClient.query("COMMIT");
      firstCommitted = true;

      const canonical = await db.templateCatalog.findUnique({ where: { slug }, select: { id: true } });
      const alias = await db.templateSlugAlias.findUnique({ where: { slug }, select: { templateCatalogId: true } });
      expect([canonical?.id, alias?.templateCatalogId].filter(Boolean)).toHaveLength(1);
      expect(canonical?.id ?? alias?.templateCatalogId).toBe(first.id);
    } finally {
      if (secondOpen) await secondClient.query("ROLLBACK").catch(() => undefined);
      if (!firstCommitted) await firstClient.query("ROLLBACK").catch(() => undefined);
      await Promise.all([firstClient.end(), secondClient.end()]);
      await db.templateCatalog.update({
        where: { id: first.id },
        data: { slug: originalSlug },
      });
    }
  });
});
