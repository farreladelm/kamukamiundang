import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { upsertAdminCredential } from "@/features/auth/admin-auth";
import { issueMagicLink } from "@/features/auth/magic-link";

beforeEach(async () => {
  await db.$executeRawUnsafe('TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer", "Admin" CASCADE');
});

describe("magic-link issuance", () => {
  it("stores only a digest, revokes replacement links, and audits safe properties", async () => {
    const admin = await upsertAdminCredential({ email: "admin@example.com", password: "correct horse battery" });
    const customer = await db.customer.create({ data: { name: "Customer" } });
    const order = await db.order.create({ data: {
      customerId: customer.id,
      templateKey: "template-1",
      templateVersion: 1,
      contentSchemaVersion: 1,
      paletteKey: "ivory",
      priceInRupiah: 100000,
      photoLimit: 20,
      storageQuotaBytes: BigInt(250) * BigInt(1024) * BigInt(1024),
      status: "PAID",
    } });
    const invitation = await db.invitation.create({ data: {
      customerId: customer.id,
      orderId: order.id,
      templateKey: order.templateKey,
      templateVersion: order.templateVersion,
      contentSchemaVersion: order.contentSchemaVersion,
      paletteKey: order.paletteKey,
      slug: "customer-invitation",
    } });

    const first = await issueMagicLink({ invitationId: invitation.id, adminId: admin.id, origin: "https://undango.test" });
    const second = await issueMagicLink({ invitationId: invitation.id, adminId: admin.id, origin: "https://undango.test" });
    const stored = await db.magicLink.findMany({ where: { invitationId: invitation.id }, orderBy: { createdAt: "asc" } });

    expect(first.url).toContain("/auth/magic/");
    expect(stored[0].tokenHash).not.toContain(first.rawToken);
    expect(stored[0].revokedAt).not.toBeNull();
    expect(stored[1].revokedAt).toBeNull();
    expect((await db.auditEvent.findMany()).every((event) => JSON.stringify(event.properties).includes(first.rawToken) === false)).toBe(true);
    expect(second.rawToken).not.toBe(first.rawToken);
  });
});
