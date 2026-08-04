import { describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { findTemplateRuntimeReferenceDrift } from "@/features/templates/catalog";
import { reconcileTemplateCatalog } from "@/features/templates/catalog-reconciliation";

describe("template runtime references", () => {
  it("reports missing runtime and incompatible schema or palette references", () => {
    const drift = findTemplateRuntimeReferenceDrift(
      [
        {
          source: "order",
          id: "order-1",
          templateKey: "template-1",
          templateVersion: 1,
          contentSchemaVersion: 2,
          paletteKey: "gading",
        },
        {
          source: "invitation",
          id: "invitation-1",
          templateKey: "template-1",
          templateVersion: 1,
          contentSchemaVersion: 99,
          paletteKey: "gading",
        },
        {
          source: "publishedSnapshot",
          id: "snapshot-1",
          templateKey: "missing-runtime",
          templateVersion: 1,
          contentSchemaVersion: 2,
          paletteKey: "gading",
        },
      ],
      [
        {
          templateKey: "template-1",
          templateVersion: 1,
          contentSchemaVersion: 2,
          paletteKeys: ["gading"],
        },
      ],
    );

    expect(drift).toEqual([
      "incompatible:invitation:invitation-1:template-1:1:schema",
      "missing:publishedSnapshot:snapshot-1:missing-runtime:1",
    ]);
  });

  it("makes a missing runtime reference a reconciliation drift", async () => {
    const customerId = "91111111-1111-4111-8111-111111111111";
    const orderId = "92111111-1111-4111-8111-111111111111";

    await db.order.deleteMany({ where: { id: orderId } });
    await db.customer.deleteMany({ where: { id: customerId } });
    await db.customer.create({ data: { id: customerId, name: "Drift Fixture" } });
    await db.order.create({
      data: {
        id: orderId,
        customerId,
        templateKey: "missing-runtime",
        templateVersion: 1,
        contentSchemaVersion: 2,
        paletteKey: "gading",
        priceInRupiah: 1,
        photoLimit: 1,
        storageQuotaBytes: BigInt(1),
      },
    });

    try {
      const report = await reconcileTemplateCatalog();
      expect(report.referencedRuntimeDrift).toContain(
        "missing:order:92111111-1111-4111-8111-111111111111:missing-runtime:1",
      );
      expect(report.hasDrift).toBe(true);
    } finally {
      await db.order.deleteMany({ where: { id: orderId } });
      await db.customer.deleteMany({ where: { id: customerId } });
    }
  });
});
