import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { upsertAdminCredential } from "@/features/auth/admin-auth";
import { activatePaidOrder, transitionOrder } from "@/features/orders/activation";
import { createPendingOrder } from "@/features/orders/data";
import { InvitationSlugConflictError } from "@/features/invitations/slug-claim";
import { reconcileTemplateCatalog } from "@/features/templates/catalog-reconciliation";

beforeEach(async () => {
  await db.$executeRawUnsafe('TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer", "Admin" CASCADE');
  await reconcileTemplateCatalog();
  await db.templateCatalog.updateMany({ data: { status: "VISIBLE" } });
});

describe("order intake and activation", () => {
  it("keeps immutable template snapshots and activates exactly once", async () => {
    const admin = await upsertAdminCredential({ email: "admin@example.com", password: "correct horse battery" });
    const order = await createPendingOrder({
      customer: { name: "Alya & Bima", whatsapp: "628123" },
      templateKey: "template-1",
      templateVersion: 1,
      paletteKey: "gading",
      photoLimit: 20,
    });

    expect(order.status).toBe("PENDING");
    expect(order.priceInRupiah).toBeGreaterThan(0);

    await transitionOrder(order.id, "PAID");
    const invitation = await activatePaidOrder(order.id, admin.id);
    const replay = await activatePaidOrder(order.id, admin.id);

    expect(invitation.id).toBe(replay.id);
    await expect(db.invitation.count({ where: { orderId: order.id } })).resolves.toBe(1);
    await expect(db.order.findUnique({ where: { id: order.id } })).resolves.toMatchObject({ status: "ACTIVATED" });
  });

  it("copies a reserved public slug during activation", async () => {
    const admin = await upsertAdminCredential({ email: "admin@example.com", password: "correct horse battery" });
    const order = await createPendingOrder({
      customer: { name: "Alya & Bima" },
      templateKey: "template-1",
      templateVersion: 1,
      paletteKey: "gading",
      photoLimit: 20,
      requestedInvitationSlug: "alya-bima-wedding",
    });

    await transitionOrder(order.id, "PAID");

    await expect(activatePaidOrder(order.id, admin.id)).resolves.toMatchObject({
      slug: "alya-bima-wedding",
    });
    await expect(db.order.findUniqueOrThrow({ where: { id: order.id } })).resolves.toMatchObject({
      requestedInvitationSlug: "alya-bima-wedding",
    });
  });

  it("activates without a public slug when no reservation exists", async () => {
    const admin = await upsertAdminCredential({ email: "admin@example.com", password: "correct horse battery" });
    const order = await createPendingOrder({
      customer: { name: "Alya & Bima" },
      templateKey: "template-1",
      templateVersion: 1,
      paletteKey: "gading",
      photoLimit: 20,
    });

    await transitionOrder(order.id, "PAID");

    await expect(activatePaidOrder(order.id, admin.id)).resolves.toMatchObject({ slug: null });
  });

  it("rejects duplicate pending slug reservations", async () => {
    const order = {
      customer: { name: "Alya & Bima" },
      templateKey: "template-1",
      templateVersion: 1,
      paletteKey: "gading",
      photoLimit: 20,
      requestedInvitationSlug: "alya-bima-wedding",
    };

    await createPendingOrder(order);
    await expect(createPendingOrder({ ...order, customer: { name: "Citra & Danu" } })).rejects.toBeInstanceOf(
      InvitationSlugConflictError,
    );
  });

  it("rejects unknown registry versions before persistence", async () => {
    await expect(createPendingOrder({
      customer: { name: "Customer" },
      templateKey: "template-1",
      templateVersion: 99,
      paletteKey: "ivory",
      photoLimit: 20,
    })).rejects.toThrow("Unknown template version or palette");
  });

  it("preserves old order snapshot price when database catalog price is updated later", async () => {
    const catalogBefore = await db.templateCatalog.findUniqueOrThrow({
      where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
    });
    const order = await createPendingOrder({
      customer: { name: "Historical Price Customer", whatsapp: "628999" },
      templateKey: "template-1",
      templateVersion: 1,
      paletteKey: "gading",
      photoLimit: 15,
    });

    expect(order.priceInRupiah).toBe(catalogBefore.priceInRupiah);

    // Update price in catalog database after order is placed
    await db.templateCatalog.update({
      where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
      data: { priceInRupiah: catalogBefore.priceInRupiah + 250000 },
    });

    const orderAfter = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(orderAfter.priceInRupiah).toBe(catalogBefore.priceInRupiah);
  });

  it("rejects order intake for HIDDEN, RETIRED, or DRAFT template status", async () => {
    for (const status of ["HIDDEN", "RETIRED", "DRAFT"] as const) {
      await db.templateCatalog.update({
        where: { templateKey_templateVersion: { templateKey: "template-1", templateVersion: 1 } },
        data: { status },
      });

      await expect(
        createPendingOrder({
          customer: { name: "Boundary Test Customer" },
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "gading",
          photoLimit: 20,
        }),
      ).rejects.toThrow("Template status is not visible for order creation");
    }
  });

  it("rejects order intake when palette key is invalid for template", async () => {
    await expect(
      createPendingOrder({
        customer: { name: "Invalid Palette Customer" },
        templateKey: "template-1",
        templateVersion: 1,
        paletteKey: "nonexistent-palette",
        photoLimit: 20,
      }),
    ).rejects.toThrow("Unknown template version or palette");
  });
});
