import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import {
  archiveInvitation,
  PublicationError,
  publishInvitation,
  setInvitationEditingEnabled,
  unpublishInvitation,
} from "@/features/invitations/publication";

const adminId = "00000000-0000-0000-0000-000000000010";

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "SnapshotAsset", "PublishedSnapshot", "InvitationContent", "MagicLink", "Session", "Rsvp", "Wish", "Asset", "Invitation", "Order", "Customer", "Admin" CASCADE',
  );
});

async function setupInvitation(content: object = {}) {
  const [admin, customer] = await Promise.all([
    db.admin.create({ data: { id: adminId, email: "admin@example.com", passwordHash: "hash" } }),
    db.customer.create({ data: { name: "Customer" } }),
  ]);
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
      slug: "publication-invitation",
    },
  });
  await db.invitationContent.create({
    data: {
      invitationId: invitation.id,
      content,
      contentSchemaVersion: invitation.contentSchemaVersion,
      updatedByActorType: "ADMIN",
      updatedByActorId: admin.id,
    },
  });
  return { admin, customer, invitation };
}

describe("invitation publication lifecycle", () => {
  it("publishes immutable draft content, ready assets, and locks editing", async () => {
    const { admin, invitation } = await setupInvitation({ bride: { nickname: "Rani" } });
    const asset = await db.asset.create({
      data: {
        invitationId: invitation.id,
        type: "IMAGE",
        status: "READY",
        storagePath: `${invitation.id}/images/ready`,
        byteSize: 100,
      },
    });

    await expect(publishInvitation(invitation.id, admin.id)).resolves.toMatchObject({
      action: "published",
      slug: invitation.slug,
    });

    await expect(db.invitation.findUniqueOrThrow({ where: { id: invitation.id } })).resolves.toMatchObject({
      status: "PUBLISHED",
      editingEnabled: false,
      publishedAt: expect.any(Date),
      archivedAt: null,
    });
    await expect(db.publishedSnapshot.findUniqueOrThrow({
      where: { invitationId: invitation.id },
      include: { assets: true },
    })).resolves.toMatchObject({
      templateKey: "template-1",
      templateVersion: 1,
      contentSchemaVersion: 2,
      paletteKey: "gading",
      content: { bride: { nickname: "Rani" } },
      assets: [{ assetId: asset.id }],
    });
    await expect(db.auditEvent.findMany({ where: { entityId: invitation.id } })).resolves.toMatchObject([
      { action: "PUBLISHED", actorId: admin.id },
    ]);
  });

  it("keeps current snapshot live while editing reopens and replaces it on republish", async () => {
    const { admin, invitation } = await setupInvitation({ bride: { nickname: "Rani" } });
    await publishInvitation(invitation.id, admin.id);
    const firstSnapshot = await db.publishedSnapshot.findUniqueOrThrow({ where: { invitationId: invitation.id } });

    await setInvitationEditingEnabled(invitation.id, admin.id, true);
    await db.invitationContent.update({
      where: { invitationId: invitation.id },
      data: {
        content: { bride: { nickname: "Sari" } },
        contentVersion: 1,
        updatedByActorId: admin.id,
      },
    });

    await expect(db.invitation.findUniqueOrThrow({ where: { id: invitation.id } })).resolves.toMatchObject({
      status: "PUBLISHED",
      editingEnabled: true,
    });
    await expect(db.publishedSnapshot.findUniqueOrThrow({ where: { invitationId: invitation.id } })).resolves.toMatchObject({
      id: firstSnapshot.id,
      content: { bride: { nickname: "Rani" } },
    });

    await expect(publishInvitation(invitation.id, admin.id)).resolves.toMatchObject({ action: "republished" });
    await expect(db.publishedSnapshot.findUniqueOrThrow({ where: { invitationId: invitation.id } })).resolves.toMatchObject({
      id: firstSnapshot.id,
      content: { bride: { nickname: "Sari" } },
    });
    await expect(db.invitation.findUniqueOrThrow({ where: { id: invitation.id } })).resolves.toMatchObject({
      status: "PUBLISHED",
      editingEnabled: false,
    });
  });

  it("rolls back publication when current draft cannot produce a valid snapshot", async () => {
    const { admin, invitation } = await setupInvitation({ bride: { nickname: "x".repeat(101) } });

    await expect(publishInvitation(invitation.id, admin.id)).rejects.toBeInstanceOf(PublicationError);
    await expect(db.publishedSnapshot.count({ where: { invitationId: invitation.id } })).resolves.toBe(0);
    await expect(db.invitation.findUniqueOrThrow({ where: { id: invitation.id } })).resolves.toMatchObject({
      status: "DRAFT",
      editingEnabled: true,
      publishedAt: null,
    });
  });

  it("unpublishes and archives only through allowed lifecycle states", async () => {
    const { admin, invitation } = await setupInvitation();
    await publishInvitation(invitation.id, admin.id);
    await db.magicLink.create({
      data: {
        tokenHash: "active-link-hash",
        customerId: invitation.customerId,
        invitationId: invitation.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await unpublishInvitation(invitation.id, admin.id);
    await expect(db.invitation.findUniqueOrThrow({ where: { id: invitation.id } })).resolves.toMatchObject({
      status: "DRAFT",
      editingEnabled: false,
    });
    await expect(db.publishedSnapshot.count({ where: { invitationId: invitation.id } })).resolves.toBe(1);

    await archiveInvitation(invitation.id, admin.id);
    await expect(db.invitation.findUniqueOrThrow({ where: { id: invitation.id } })).resolves.toMatchObject({
      status: "ARCHIVED",
      editingEnabled: false,
      archivedAt: expect.any(Date),
    });
    await expect(db.magicLink.findUniqueOrThrow({ where: { tokenHash: "active-link-hash" } })).resolves.toMatchObject({
      revokedAt: expect.any(Date),
    });
    await expect(unpublishInvitation(invitation.id, admin.id)).rejects.toBeInstanceOf(PublicationError);
  });
});
