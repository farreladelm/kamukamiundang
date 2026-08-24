import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { workspaceDraftSchema } from "./workspace-dto";
import { getPublicInvitationBySlug } from "./public-data";

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "SnapshotAsset", "PublishedSnapshot", "InvitationContent", "MagicLink", "Session", "Rsvp", "Wish", "Asset", "Invitation", "Order", "Customer", "Admin" CASCADE',
  );
});

async function setupPublishedInvitation() {
  const customer = await db.customer.create({ data: { name: "Customer" } });
  const order = await db.order.create({
    data: {
      customerId: customer.id,
      templateKey: "template-1",
      templateVersion: 1,
      contentSchemaVersion: 2,
      paletteKey: "gading",
      priceInRupiah: 100000,
      photoLimit: 20,
      storageQuotaBytes: BigInt(250) * BigInt(1024) * BigInt(1024),
      status: "PAID",
    },
  });
  const invitation = await db.invitation.create({
    data: {
      customerId: customer.id,
      orderId: order.id,
      templateKey: order.templateKey,
      templateVersion: order.templateVersion,
      contentSchemaVersion: order.contentSchemaVersion,
      paletteKey: order.paletteKey,
      slug: "public-invitation",
      status: "PUBLISHED",
      editingEnabled: false,
      publishedAt: new Date(),
    },
  });
  const snapshotContent = workspaceDraftSchema.parse({
    bride: { nickname: "Rani", fullName: "Rani Prameswari" },
    groom: { nickname: "Dimas", fullName: "Dimas Adinata" },
  });
  await db.publishedSnapshot.create({
    data: {
      invitationId: invitation.id,
      templateKey: invitation.templateKey,
      templateVersion: invitation.templateVersion,
      contentSchemaVersion: invitation.contentSchemaVersion,
      paletteKey: invitation.paletteKey,
      content: snapshotContent,
    },
  });
  await db.invitationContent.create({
    data: {
      invitationId: invitation.id,
      content: workspaceDraftSchema.parse({ bride: { nickname: "Draft leak" } }),
      contentSchemaVersion: invitation.contentSchemaVersion,
      updatedByActorType: "ADMIN",
      updatedByActorId: customer.id,
    },
  });

  return { invitation };
}

describe("public invitation data", () => {
  it("uses only published snapshot content and exact pinned runtime", async () => {
    const { invitation } = await setupPublishedInvitation();
    if (!invitation.slug) throw new Error("Published fixture requires a slug");

    await expect(getPublicInvitationBySlug(invitation.slug)).resolves.toMatchObject({
      slug: invitation.slug,
      runtime: { templateKey: "template-1", templateVersion: 1 },
      content: {
        couple: { firstName: "Rani", secondName: "Dimas" },
        opening: expect.any(String),
      },
    });
  });

  it("fails closed for unknown, non-public, missing, or incompatible snapshots", async () => {
    const { invitation } = await setupPublishedInvitation();
    if (!invitation.slug) throw new Error("Published fixture requires a slug");

    await expect(getPublicInvitationBySlug("unknown-invitation")).resolves.toBeNull();
    await db.invitation.update({ where: { id: invitation.id }, data: { status: "DRAFT" } });
    await expect(getPublicInvitationBySlug(invitation.slug)).resolves.toBeNull();

    await db.invitation.update({ where: { id: invitation.id }, data: { status: "PUBLISHED" } });
    await db.publishedSnapshot.delete({ where: { invitationId: invitation.id } });
    await expect(getPublicInvitationBySlug(invitation.slug)).resolves.toBeNull();

    await db.publishedSnapshot.create({
      data: {
        invitationId: invitation.id,
        templateKey: "template-1",
        templateVersion: 99,
        contentSchemaVersion: 2,
        paletteKey: "gading",
        content: workspaceDraftSchema.parse({}),
      },
    });
    await expect(getPublicInvitationBySlug(invitation.slug)).resolves.toBeNull();
  });
});
