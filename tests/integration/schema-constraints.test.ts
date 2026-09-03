import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";

const customerId = "00000000-0000-0000-0000-000000000001";
const orderId = "00000000-0000-0000-0000-000000000002";
const invitationId = "00000000-0000-0000-0000-000000000003";

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "SnapshotAsset", "PublishedSnapshot", "InvitationContent", "MagicLink", "Session", "Rsvp", "Wish", "Asset", "Invitation", "Order", "Customer", "Admin" CASCADE',
  );
});

describe("core schema constraints", () => {
  it("enforces lifecycle, paid activation, normalized slug, draft version, and guest idempotency", async () => {
    await db.$executeRawUnsafe(
      `INSERT INTO "Customer" ("id", "name", "createdAt", "updatedAt") VALUES ('${customerId}', 'Customer', now(), now())`,
    );
    await db.$executeRawUnsafe(
      `INSERT INTO "Order" ("id", "customerId", "templateKey", "templateVersion", "contentSchemaVersion", "paletteKey", "priceInRupiah", "photoLimit", "storageQuotaBytes", "createdAt", "updatedAt") VALUES ('${orderId}', '${customerId}', 'template-1', 1, 1, 'ivory', 100000, 10, 262144000, now(), now())`,
    );

    await expect(
      db.$executeRawUnsafe(`UPDATE "Order" SET "status" = 'ACTIVATED' WHERE "id" = '${orderId}'`),
    ).rejects.toThrow(/invalid order status transition/);

    await expect(
      db.$executeRawUnsafe(`INSERT INTO "Invitation" ("id", "customerId", "orderId", "templateKey", "templateVersion", "contentSchemaVersion", "paletteKey", "slug", "createdAt", "updatedAt") VALUES ('${invitationId}', '${customerId}', '${orderId}', 'template-1', 1, 1, 'ivory', 'valid-slug', now(), now())`),
    ).rejects.toThrow(/only paid orders can activate/);

    await db.$executeRawUnsafe(`UPDATE "Order" SET "status" = 'PAID' WHERE "id" = '${orderId}'`);
    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "Invitation" ("id", "customerId", "orderId", "templateKey", "templateVersion", "contentSchemaVersion", "paletteKey", "slug", "createdAt", "updatedAt") VALUES ('${invitationId}', '${customerId}', '${orderId}', 'template-1', 1, 1, 'ivory', 'Uppercase', now(), now())`,
      ),
    ).rejects.toThrow(/normalized_slug/);
    await db.$executeRawUnsafe(
      `INSERT INTO "Invitation" ("id", "customerId", "orderId", "templateKey", "templateVersion", "contentSchemaVersion", "paletteKey", "slug", "createdAt", "updatedAt") VALUES ('${invitationId}', '${customerId}', '${orderId}', 'template-1', 1, 1, 'ivory', 'valid-slug', now(), now())`,
    );
    await db.$executeRawUnsafe(
      `INSERT INTO "InvitationContent" ("id", "invitationId", "content", "contentSchemaVersion", "updatedByActorType", "updatedByActorId", "createdAt", "updatedAt") VALUES ('00000000-0000-0000-0000-000000000004', '${invitationId}', '{}', 1, 'CUSTOMER', '${customerId}', now(), now())`,
    );
    await expect(
      db.$executeRawUnsafe(
        `UPDATE "Invitation" SET "status" = 'PUBLISHED', "slug" = NULL WHERE "id" = '${invitationId}'`,
      ),
    ).rejects.toThrow(/Invitation_published_slug_check/);
    await expect(
      db.$executeRawUnsafe(`UPDATE "Invitation" SET "status" = 'PUBLISHED' WHERE "id" = '${invitationId}'`),
    ).resolves.toBe(1);
    await expect(
      db.$executeRawUnsafe(`UPDATE "InvitationContent" SET "content" = '{"name":"new"}' WHERE "invitationId" = '${invitationId}'`),
    ).rejects.toThrow(/content version must increment/);
    await db.$executeRawUnsafe(
      `INSERT INTO "Rsvp" ("id", "invitationId", "name", "attendance", "guestCount", "idempotencyKey", "createdAt") VALUES ('00000000-0000-0000-0000-000000000005', '${invitationId}', 'Guest', 'ATTENDING', 1, 'request-1', now())`,
    );
    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "Rsvp" ("id", "invitationId", "name", "attendance", "guestCount", "idempotencyKey", "createdAt") VALUES ('00000000-0000-0000-0000-000000000006', '${invitationId}', 'Guest', 'ATTENDING', 1, 'request-1', now())`,
      ),
    ).rejects.toThrow();
  });
});
