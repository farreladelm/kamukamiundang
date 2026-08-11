import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { reconcileTemplateCatalog } from "@/features/templates/catalog-reconciliation";

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let statement = "";
  let inDollarQuote = false;

  for (let index = 0; index < sql.length; index += 1) {
    if (sql.slice(index, index + 2) === "$$") {
      inDollarQuote = !inDollarQuote;
      statement += "$$";
      index += 1;
      continue;
    }

    if (sql[index] === ";" && !inDollarQuote) {
      if (statement.trim()) statements.push(statement);
      statement = "";
      continue;
    }

    statement += sql[index];
  }

  if (statement.trim()) statements.push(statement);
  return statements;
}

async function deleteFixtureCatalog(templateKey: string) {
  const catalog = await db.templateCatalog.findUnique({
    where: { templateKey_templateVersion: { templateKey, templateVersion: 1 } },
    select: { id: true },
  });
  if (!catalog) return;

  await db.templateSlugAlias.deleteMany({ where: { templateCatalogId: catalog.id } });
  await db.templateCatalog.delete({ where: { id: catalog.id } });
}

beforeEach(async () => {
  await deleteFixtureCatalog("fixture-template-collision");
  const retired = await db.templateCatalog.findUnique({
    where: { templateKey_templateVersion: { templateKey: "retired-runtime", templateVersion: 1 } },
    select: { id: true },
  });
  if (retired) {
    await db.templateSlugAlias.deleteMany({ where: { templateCatalogId: retired.id } });
    await db.templateCatalog.delete({ where: { id: retired.id } });
  }
  await db.templateCatalog.updateMany({
    where: { updatedByAdminId: { not: null } },
    data: {
      updatedByAdminId: null,
    },
  });
  await db.admin.deleteMany({ where: { email: "catalog-admin@example.com" } });
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer" CASCADE',
  );
  await reconcileTemplateCatalog();
  await db.templateCatalog.update({
    where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
    data: {
      name: "Larasati",
      description: "Klasik Jawa yang tenang, dengan ritme editorial dan detail berbingkai.",
      priceInRupiah: 650000,
      displayOrder: 10,
    },
  });
  await db.templateCatalog.updateMany({
    where: { templateKey: { in: ["template-1", "template-2", "template-3"] } },
    data: { status: "VISIBLE" },
  });
});

afterEach(async () => {
  await deleteFixtureCatalog("fixture-template-collision");
  await db.templateSlugAlias.deleteMany({
    where: { slug: { in: ["historical-slug", "current-alias-one", "current-alias-two"] } },
  });
  const retired = await db.templateCatalog.findUnique({
    where: { templateKey_templateVersion: { templateKey: "retired-runtime", templateVersion: 1 } },
    select: { id: true },
  });
  if (retired) {
    await db.templateSlugAlias.deleteMany({ where: { templateCatalogId: retired.id } });
    await db.templateCatalog.delete({ where: { id: retired.id } });
  }
  await db.templateCatalog.update({
    where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
    data: {
      name: "Larasati",
      description: "Klasik Jawa yang tenang, dengan ritme editorial dan detail berbingkai.",
      priceInRupiah: 650000,
      displayOrder: 10,
      updatedByAdminId: null,
    },
  });
  await db.admin.deleteMany({ where: { email: "catalog-admin@example.com" } });
});

describe("template catalog migration foundation", () => {
  it("preserves launch metadata and effective visibility for all three templates", async () => {
    const templates = (await db.templateCatalog.findMany({
      orderBy: { displayOrder: "asc" },
      include: { category: true, slugAliases: true },
    })).filter((template) => ["template-1", "template-2", "template-3"].includes(template.templateKey));

    expect(templates).toMatchObject([
      {
        templateKey: "template-1",
        templateVersion: 1,
        slug: "larasati",
        name: "Larasati",
        description: "Klasik Jawa yang tenang, dengan ritme editorial dan detail berbingkai.",
        priceInRupiah: 650000,
        displayOrder: 10,
        status: "VISIBLE",
        category: { key: "klasik", name: "Klasik" },
        slugAliases: [{ slug: "larasati", isCurrent: true }],
      },
      {
        templateKey: "template-2",
        templateVersion: 1,
        slug: "pesisir-senja",
        name: "Pesisir Senja",
        description: "Modern hangat dengan garis horison, ruang lega, dan warna matahari sore.",
        priceInRupiah: 700000,
        displayOrder: 20,
        status: "VISIBLE",
        category: { key: "modern", name: "Modern" },
      },
      {
        templateKey: "template-3",
        templateVersion: 1,
        slug: "taman-aksara",
        name: "Taman Aksara",
        description: "Botanical kontemporer untuk perayaan intim dengan aksara yang lembut.",
        priceInRupiah: 750000,
        displayOrder: 30,
        status: "VISIBLE",
        category: { key: "botanical", name: "Botanical" },
      },
    ]);
  });

  it("reconciles idempotently without overwriting admin metadata", async () => {
    const admin = await db.admin.create({
      data: {
        email: "catalog-admin@example.com",
        passwordHash: "not-a-real-password-hash",
      },
    });
    const edited = await db.templateCatalog.update({
      where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
      data: {
        name: "Larasati Admin",
        description: "Deskripsi hasil kurasi admin.",
        priceInRupiah: 825000,
        displayOrder: 5,
        updatedByAdminId: admin.id,
      },
    });

    const first = await reconcileTemplateCatalog();
    const second = await reconcileTemplateCatalog();
    const result = await db.templateCatalog.findUniqueOrThrow({
      where: { id: edited.id },
    });

    expect(first.createdCatalogRecords).toBe(0);
    expect(second.createdCatalogRecords).toBe(0);
    expect(second.createdAliasRecords).toBe(0);
    expect(result).toMatchObject({
      name: "Larasati Admin",
      description: "Deskripsi hasil kurasi admin.",
      priceInRupiah: 825000,
      displayOrder: 5,
      updatedByAdminId: admin.id,
    });
  });

  it("reports metadata without a shipped runtime instead of changing it", async () => {
    const category = await db.templateCategory.findUniqueOrThrow({ where: { key: "klasik" } });
    await db.templateCatalog.create({
      data: {
        templateKey: "retired-runtime",
        templateVersion: 1,
        slug: "retired-runtime",
        name: "Retired Runtime",
        description: "Historical metadata",
        priceInRupiah: 100000,
        displayOrder: 99,
        status: "RETIRED",
        categoryId: category.id,
      },
    });

    const report = await reconcileTemplateCatalog();

    expect(report.metadataOnly).toContain("retired-runtime:1");
    expect(report.hasDrift).toBe(true);
  });

  it("rejects reusing historical alias slug as another catalog slug", async () => {
    const template = await db.templateCatalog.findUniqueOrThrow({
      where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
    });
    const category = await db.templateCategory.findUniqueOrThrow({ where: { key: "klasik" } });
    await db.templateSlugAlias.create({
      data: {
        slug: "historical-slug",
        templateCatalogId: template.id,
        isCurrent: false,
      },
    });

    await expect(
      db.templateCatalog.create({
        data: {
          templateKey: "fixture-template-collision",
          templateVersion: 1,
          slug: "historical-slug",
          name: "Collision",
          description: "Collision",
          priceInRupiah: 100000,
          displayOrder: 40,
          status: "DRAFT",
          categoryId: category.id,
        },
      }),
    ).rejects.toThrow();
  });

  it("allows at most one current alias per catalog", async () => {
    const template = await db.templateCatalog.findUniqueOrThrow({
      where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
    });
    await expect(
      db.templateSlugAlias.create({
        data: {
          slug: "current-alias-two",
          templateCatalogId: template.id,
          isCurrent: true,
        },
      }),
    ).rejects.toThrow();
  });

  it("maps an existing hidden legacy override to hidden catalog status during migration", async () => {
    const migration = await readFile(
      join(process.cwd(), "prisma", "migrations", "20260804193000_template_catalog", "migration.sql"),
      "utf8",
    );

    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('DROP SCHEMA IF EXISTS "template_catalog_migration_fixture" CASCADE');
      await tx.$executeRawUnsafe('CREATE SCHEMA "template_catalog_migration_fixture"');
      await tx.$executeRawUnsafe('SET LOCAL search_path TO "template_catalog_migration_fixture"');
      await tx.$executeRawUnsafe('CREATE TABLE "Admin" ("id" UUID PRIMARY KEY)');
      await tx.$executeRawUnsafe('CREATE TABLE "Customer" ("id" UUID PRIMARY KEY, "name" TEXT NOT NULL)');
      await tx.$executeRawUnsafe(
        'CREATE TABLE "Order" ("id" UUID PRIMARY KEY, "customerId" UUID NOT NULL, "templateKey" TEXT NOT NULL, "templateVersion" INTEGER NOT NULL, "contentSchemaVersion" INTEGER NOT NULL, "paletteKey" TEXT NOT NULL, "priceInRupiah" INTEGER NOT NULL)',
      );
      await tx.$executeRawUnsafe(
        'CREATE TABLE "Invitation" ("id" UUID PRIMARY KEY, "customerId" UUID NOT NULL, "orderId" UUID NOT NULL, "templateKey" TEXT NOT NULL, "templateVersion" INTEGER NOT NULL, "contentSchemaVersion" INTEGER NOT NULL, "paletteKey" TEXT NOT NULL, "slug" TEXT NOT NULL)',
      );
      await tx.$executeRawUnsafe(
        'CREATE TABLE "PublishedSnapshot" ("id" UUID PRIMARY KEY, "invitationId" UUID NOT NULL, "templateKey" TEXT NOT NULL, "templateVersion" INTEGER NOT NULL, "contentSchemaVersion" INTEGER NOT NULL, "paletteKey" TEXT NOT NULL, "content" JSONB NOT NULL)',
      );
      await tx.$executeRawUnsafe(
        'CREATE TABLE "TemplateVisibility" ("templateKey" TEXT NOT NULL, "templateVersion" INTEGER NOT NULL, "isVisible" BOOLEAN NOT NULL, "updatedByAdminId" UUID, "updatedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL)',
      );
      await tx.$executeRawUnsafe(
        'INSERT INTO "Admin" ("id") VALUES (\'41111111-1111-4111-8111-111111111111\')',
      );
      await tx.$executeRawUnsafe(
        'INSERT INTO "Customer" ("id", "name") VALUES (\'51111111-1111-4111-8111-111111111111\', \'Historical Customer\')',
      );
      await tx.$executeRawUnsafe(
        'INSERT INTO "Order" ("id", "customerId", "templateKey", "templateVersion", "contentSchemaVersion", "paletteKey", "priceInRupiah") VALUES (\'61111111-1111-4111-8111-111111111111\', \'51111111-1111-4111-8111-111111111111\', \'template-2\', 1, 2, \'samudra\', 700000)',
      );
      await tx.$executeRawUnsafe(
        'INSERT INTO "Invitation" ("id", "customerId", "orderId", "templateKey", "templateVersion", "contentSchemaVersion", "paletteKey", "slug") VALUES (\'71111111-1111-4111-8111-111111111111\', \'51111111-1111-4111-8111-111111111111\', \'61111111-1111-4111-8111-111111111111\', \'template-2\', 1, 2, \'samudra\', \'historical-invitation\')',
      );
      await tx.$executeRawUnsafe(
        'INSERT INTO "PublishedSnapshot" ("id", "invitationId", "templateKey", "templateVersion", "contentSchemaVersion", "paletteKey", "content") VALUES (\'81111111-1111-4111-8111-111111111111\', \'71111111-1111-4111-8111-111111111111\', \'template-2\', 1, 2, \'samudra\', \'{"version":"before"}\')',
      );
      await tx.$executeRawUnsafe(
        'INSERT INTO "TemplateVisibility" ("templateKey", "templateVersion", "isVisible", "updatedByAdminId", "updatedAt", "createdAt") VALUES (\'template-2\', 1, false, \'41111111-1111-4111-8111-111111111111\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      );
      for (const statement of splitSqlStatements(migration)) {
        if (statement.trim()) await tx.$executeRawUnsafe(statement);
      }
      const guardMigration = await readFile(
        join(process.cwd(), "prisma", "migrations", "20260804210000_template_catalog_slug_integrity", "migration.sql"),
        "utf8",
      );
      for (const statement of splitSqlStatements(guardMigration)) {
        if (statement.trim()) await tx.$executeRawUnsafe(statement);
      }
      const advisoryLockMigration = await readFile(
        join(process.cwd(), "prisma", "migrations", "20260805091000_template_catalog_slug_advisory_lock", "migration.sql"),
        "utf8",
      );
      for (const statement of splitSqlStatements(advisoryLockMigration)) {
        if (statement.trim()) await tx.$executeRawUnsafe(statement);
      }
      await tx.$executeRawUnsafe(
        'INSERT INTO "TemplateCatalog" ("id", "templateKey", "templateVersion", "slug", "name", "categoryId", "description", "priceInRupiah", "displayOrder", "status", "createdAt", "updatedAt") VALUES (\'91111111-1111-4111-8111-111111111111\', \'backfill-draft\', 1, \'backfill-draft\', \'Backfill Draft\', \'11111111-1111-4111-8111-111111111111\', \'Draft\', 1, 1, \'DRAFT\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (\'91111111-1111-4111-8111-111111111112\', \'backfill-visible\', 1, \'backfill-visible\', \'Backfill Visible\', \'11111111-1111-4111-8111-111111111111\', \'Visible\', 1, 2, \'VISIBLE\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (\'91111111-1111-4111-8111-111111111113\', \'backfill-hidden\', 1, \'backfill-hidden\', \'Backfill Hidden\', \'11111111-1111-4111-8111-111111111111\', \'Hidden\', 1, 3, \'HIDDEN\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (\'91111111-1111-4111-8111-111111111114\', \'backfill-retired\', 1, \'backfill-retired\', \'Backfill Retired\', \'11111111-1111-4111-8111-111111111111\', \'Retired\', 1, 4, \'RETIRED\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      );
      const publicationHistoryMigration = await readFile(
        join(process.cwd(), "prisma", "migrations", "20260805090000_template_catalog_publication_history", "migration.sql"),
        "utf8",
      );
      for (const statement of splitSqlStatements(publicationHistoryMigration)) {
        if (statement.trim()) await tx.$executeRawUnsafe(statement);
      }

      const rows = await tx.$queryRawUnsafe<Array<{ status: string; updatedByAdminId: string }>>(
        'SELECT "status", "updatedByAdminId" FROM "TemplateCatalog" WHERE "templateKey" = \'template-2\' AND "templateVersion" = 1',
      );
      expect(rows).toEqual([
        expect.objectContaining({ status: "HIDDEN", updatedByAdminId: "41111111-1111-4111-8111-111111111111" }),
      ]);
      const historicalRows = await tx.$queryRawUnsafe<Array<Record<string, unknown>>>(
        'SELECT o."templateKey", o."templateVersion", o."contentSchemaVersion", o."paletteKey", o."priceInRupiah", i."slug", s."content" FROM "Order" o JOIN "Invitation" i ON i."orderId" = o."id" JOIN "PublishedSnapshot" s ON s."invitationId" = i."id"',
      );
      expect(historicalRows).toEqual([
        expect.objectContaining({
          templateKey: "template-2",
          templateVersion: 1,
          contentSchemaVersion: 2,
          paletteKey: "samudra",
          priceInRupiah: 700000,
          slug: "historical-invitation",
          content: { version: "before" },
        }),
      ]);
      const backfillRows = await tx.$queryRawUnsafe<Array<{ status: string; hasBeenVisible: boolean }>>(
        'SELECT "status", "hasBeenVisible" FROM "TemplateCatalog" WHERE "templateKey" LIKE \'backfill-%\' ORDER BY CASE "status" WHEN \'DRAFT\' THEN 1 WHEN \'VISIBLE\' THEN 2 WHEN \'HIDDEN\' THEN 3 WHEN \'RETIRED\' THEN 4 END',
      );
      expect(backfillRows).toEqual([
        { status: "DRAFT", hasBeenVisible: false },
        { status: "VISIBLE", hasBeenVisible: true },
        { status: "HIDDEN", hasBeenVisible: true },
        { status: "RETIRED", hasBeenVisible: true },
      ]);
      await tx.$executeRawUnsafe('DROP SCHEMA "template_catalog_migration_fixture" CASCADE');
    });
  });
});
