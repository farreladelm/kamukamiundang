import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import {
  assertInvitationSlugAvailable,
  InvitationSlugConflictError,
} from "@/features/invitations/slug-claim";

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "Invitation", "Order", "Customer" CASCADE',
  );
});

async function createOrder(
  requestedInvitationSlug: string | null,
  status: "PENDING" | "PAID" = "PENDING",
) {
  const customer = await db.customer.create({ data: { name: "Slug Customer" } });
  return db.order.create({
    data: {
      customerId: customer.id,
      templateKey: "template-1",
      templateVersion: 1,
      contentSchemaVersion: 2,
      paletteKey: "gading",
      requestedInvitationSlug,
      priceInRupiah: 100000,
      photoLimit: 20,
      storageQuotaBytes: BigInt(250) * BigInt(1024) * BigInt(1024),
      status,
    },
  });
}

describe("invitation slug claims", () => {
  it("rejects a slug reserved by another pending order", async () => {
    await createOrder("farrel-kinan-wedding");

    await expect(
      db.$transaction((tx) => assertInvitationSlugAvailable(tx, "farrel-kinan-wedding")),
    ).rejects.toBeInstanceOf(InvitationSlugConflictError);
  });

  it("rejects a slug owned by another invitation", async () => {
    const order = await createOrder(null, "PAID");
    await db.invitation.create({
      data: {
        customerId: order.customerId,
        orderId: order.id,
        templateKey: order.templateKey,
        templateVersion: order.templateVersion,
        contentSchemaVersion: order.contentSchemaVersion,
        paletteKey: order.paletteKey,
        slug: "farrel-kinan-wedding",
      },
    });

    await expect(
      db.$transaction((tx) => assertInvitationSlugAvailable(tx, "farrel-kinan-wedding")),
    ).rejects.toBeInstanceOf(InvitationSlugConflictError);
  });

  it("allows an owner to retain its own reservation", async () => {
    const order = await createOrder("farrel-kinan-wedding");

    await expect(
      db.$transaction((tx) =>
        assertInvitationSlugAvailable(tx, "farrel-kinan-wedding", { orderId: order.id }),
      ),
    ).resolves.toBeUndefined();
  });
});
