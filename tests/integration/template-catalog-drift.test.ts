import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { reconcileTemplateCatalog } from "@/features/templates/catalog-reconciliation";

const execFileAsync = promisify(execFile);

const FIXTURE_UNSHIPPED_KEY = "unshipped-metadata-template";
const FIXTURE_ORPHAN_ORDER_ID = "93111111-1111-4111-8111-111111111111";
const FIXTURE_ORPHAN_CUSTOMER_ID = "94111111-1111-4111-8111-111111111111";

async function cleanupDriftFixtures() {
  await db.order.deleteMany({ where: { id: FIXTURE_ORPHAN_ORDER_ID } });
  await db.customer.deleteMany({ where: { id: FIXTURE_ORPHAN_CUSTOMER_ID } });

  const unshipped = await db.templateCatalog.findUnique({
    where: { templateKey_templateVersion: { templateKey: FIXTURE_UNSHIPPED_KEY, templateVersion: 1 } },
    select: { id: true },
  });
  if (unshipped) {
    await db.templateSlugAlias.deleteMany({ where: { templateCatalogId: unshipped.id } });
    await db.templateCatalog.delete({ where: { id: unshipped.id } });
  }
}

beforeEach(async () => {
  await cleanupDriftFixtures();
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer" CASCADE',
  );
  await reconcileTemplateCatalog();
  await db.templateCatalog.updateMany({ data: { status: "VISIBLE" } });
});

afterEach(async () => {
  await cleanupDriftFixtures();
});

describe("template catalog deployment drift gate and release verification", () => {
  it("detects visible metadata without a shipped runtime code manifest and sets hasDrift to true", async () => {
    const category = await db.templateCategory.findUniqueOrThrow({ where: { key: "klasik" } });
    await db.templateCatalog.create({
      data: {
        templateKey: FIXTURE_UNSHIPPED_KEY,
        templateVersion: 1,
        slug: "unshipped-metadata",
        name: "Unshipped Metadata Template",
        description: "Catalog metadata deployed without code runtime manifest",
        priceInRupiah: 500000,
        displayOrder: 999,
        status: "VISIBLE",
        categoryId: category.id,
      },
    });

    const report = await reconcileTemplateCatalog();

    expect(report.metadataOnly).toContain(`${FIXTURE_UNSHIPPED_KEY}:1`);
    expect(report.hasDrift).toBe(true);
  });

  it("detects active database order references pointing to missing runtime manifests", async () => {
    await db.customer.create({
      data: { id: FIXTURE_ORPHAN_CUSTOMER_ID, name: "Drift Verification Customer" },
    });
    await db.order.create({
      data: {
        id: FIXTURE_ORPHAN_ORDER_ID,
        customerId: FIXTURE_ORPHAN_CUSTOMER_ID,
        templateKey: "nonexistent-runtime-template",
        templateVersion: 1,
        contentSchemaVersion: 1,
        paletteKey: "default",
        priceInRupiah: 600000,
        photoLimit: 10,
        storageQuotaBytes: BigInt(1048576),
        status: "PENDING",
      },
    });

    const report = await reconcileTemplateCatalog();

    expect(report.referencedRuntimeDrift).toContain(
      `missing:order:${FIXTURE_ORPHAN_ORDER_ID}:nonexistent-runtime-template:1`,
    );
    expect(report.hasDrift).toBe(true);
  });

  it("fails CLI reconciliation script with exit code 1 when deployment drift is detected", async () => {
    const category = await db.templateCategory.findUniqueOrThrow({ where: { key: "klasik" } });
    await db.templateCatalog.create({
      data: {
        templateKey: FIXTURE_UNSHIPPED_KEY,
        templateVersion: 1,
        slug: "unshipped-metadata-cli",
        name: "Unshipped Metadata Template CLI",
        description: "Unshipped metadata that must fail CLI release gate",
        priceInRupiah: 500000,
        displayOrder: 998,
        status: "VISIBLE",
        categoryId: category.id,
      },
    });

    const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "pnpm";
    const args = process.platform === "win32"
      ? ["/d", "/s", "/c", "pnpm templates:reconcile"]
      : ["templates:reconcile"];

    let failedWithError = false;
    let stdout = "";

    try {
      const result = await execFileAsync(command, args, {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      });
      stdout = result.stdout;
    } catch (error) {
      failedWithError = true;
      const errResult = error as { stdout?: string; code?: number };
      stdout = errResult.stdout ?? "";
    }

    expect(failedWithError).toBe(true);
    const jsonLine = stdout.split("\n").map((line) => line.trim()).find((line) => line.startsWith("{")) ?? "";
    const report = JSON.parse(jsonLine);
    expect(report.hasDrift).toBe(true);
  }, 30_000);

  it("passes clean reconciliation when database metadata and runtime code manifests are synchronized", async () => {
    const report = await reconcileTemplateCatalog();
    expect(report.hasDrift).toBe(false);
    expect(report.metadataOnly).toHaveLength(0);
    expect(report.referencedRuntimeDrift).toHaveLength(0);
  });
});
