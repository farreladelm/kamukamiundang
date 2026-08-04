import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { consumeMagicLink, issueMagicLink } from "@/features/auth/magic-link";
import { upsertAdminCredential } from "@/features/auth/admin-auth";
import { getOwnedEditableInvitation } from "@/features/auth/customer-policy";

beforeEach(async () => {
  await db.$executeRawUnsafe('TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer", "Admin" CASCADE');
});

async function setupLink() {
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
  return { link: await issueMagicLink({ invitationId: invitation.id, adminId: admin.id, origin: "https://undango.test" }), customerId: customer.id, invitationId: invitation.id };
}

describe("customer magic-link consumption", () => {
  it("atomically consumes once and creates one customer session", async () => {
    const { link, customerId, invitationId } = await setupLink();
    const results = await Promise.allSettled([consumeMagicLink(link.rawToken), consumeMagicLink(link.rawToken)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    await expect(db.session.count({ where: { actorType: "CUSTOMER" } })).resolves.toBe(1);
    await expect(consumeMagicLink(link.rawToken)).rejects.toThrow("invalid or expired");
    await expect(getOwnedEditableInvitation(invitationId, customerId)).resolves.toMatchObject({ id: invitationId });
    await expect(getOwnedEditableInvitation(invitationId, "00000000-0000-0000-0000-000000000099")).rejects.toThrow("access denied");
  });
});
