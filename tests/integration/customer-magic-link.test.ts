import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { consumeMagicLink, issueMagicLink } from "@/features/auth/magic-link";
import { upsertAdminCredential } from "@/features/auth/admin-auth";
import { getOwnedEditableInvitation } from "@/features/auth/customer-policy";
import {
  CUSTOMER_SESSION_TTL_MS,
  createCustomerSession,
  getCustomerSession,
} from "@/features/auth/session";

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

  it("initializes customer session with 7-day TTL upon consumption", async () => {
    const { link, customerId } = await setupLink();
    const now = new Date("2026-09-01T10:00:00.000Z");
    await consumeMagicLink(link.rawToken, now);

    const session = await db.session.findFirst({
      where: { customerId, actorType: "CUSTOMER" },
    });

    expect(session).not.toBeNull();
    expect(session!.expiresAt.getTime()).toBe(now.getTime() + CUSTOMER_SESSION_TTL_MS);
    expect(session!.expiresAt.getTime()).toBe(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  });

  it("slides session expiration forward by 7 days on each authenticated getCustomerSession call", async () => {
    const customer = await db.customer.create({ data: { name: "Sliding Customer" } });
    const initialTime = new Date("2026-09-01T12:00:00.000Z");
    const token = await createCustomerSession(customer.id, initialTime);

    // Initial session expires in 7 days
    const stored1 = await db.session.findFirstOrThrow({ where: { customerId: customer.id } });
    expect(stored1.expiresAt.getTime()).toBe(initialTime.getTime() + CUSTOMER_SESSION_TTL_MS);

    // 3 days later, customer accesses their workspace
    const day3Time = new Date("2026-09-04T12:00:00.000Z");
    const sessionResult = await getCustomerSession(token, day3Time);

    expect(sessionResult).not.toBeNull();
    expect(sessionResult!.customer.id).toBe(customer.id);
    expect(sessionResult!.session.expiresAt.getTime()).toBe(day3Time.getTime() + CUSTOMER_SESSION_TTL_MS);

    // Verify database was updated with the sliding expiration and lastUsedAt
    const stored2 = await db.session.findFirstOrThrow({ where: { customerId: customer.id } });
    expect(stored2.lastUsedAt?.getTime()).toBe(day3Time.getTime());
    expect(stored2.expiresAt.getTime()).toBe(day3Time.getTime() + CUSTOMER_SESSION_TTL_MS);
  });

  it("rejects sessions that have exceeded the 7-day inactivity window", async () => {
    const customer = await db.customer.create({ data: { name: "Inactive Customer" } });
    const initialTime = new Date("2026-09-01T12:00:00.000Z");
    const token = await createCustomerSession(customer.id, initialTime);

    // Customer visits 7 days and 1 second later without prior activity
    const expiredTime = new Date(initialTime.getTime() + CUSTOMER_SESSION_TTL_MS + 1000);
    const sessionResult = await getCustomerSession(token, expiredTime);

    expect(sessionResult).toBeNull();
  });
});
