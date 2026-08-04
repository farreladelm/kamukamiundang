import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { upsertAdminCredential } from "@/features/auth/admin-auth";
import { activatePaidOrder, transitionOrder } from "@/features/orders/activation";
import { createPendingOrder } from "@/features/orders/data";

beforeEach(async () => {
  await db.$executeRawUnsafe('TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer", "Admin" CASCADE');
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

  it("rejects unknown registry versions before persistence", async () => {
    await expect(createPendingOrder({
      customer: { name: "Customer" },
      templateKey: "template-1",
      templateVersion: 99,
      paletteKey: "ivory",
      photoLimit: 20,
    })).rejects.toThrow("Unknown template version or palette");
  });
});
