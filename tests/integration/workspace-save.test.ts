import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import {
  getWorkspaceInvitationDtoForCustomer,
  WorkspaceUnavailableError,
} from "@/features/invitations/workspace-dto";
import { saveWorkspaceDraftForCustomer } from "@/features/workspace/actions";

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer", "Admin" CASCADE',
  );
});

async function setupWorkspace(contentSchemaVersion = 2) {
  const customer = await db.customer.create({ data: { name: "Customer" } });
  const order = await db.order.create({
    data: {
      customerId: customer.id,
      templateKey: "template-1",
      templateVersion: 1,
      contentSchemaVersion,
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
      slug: "workspace-invitation",
    },
  });
  await db.invitationContent.create({
    data: {
      invitationId: invitation.id,
      content: {},
      contentSchemaVersion: invitation.contentSchemaVersion,
      updatedByActorType: "ADMIN",
      updatedByActorId: customer.id,
    },
  });

  return { customer, invitation };
}

describe("versioned customer workspace drafts", () => {
  it("loads pinned draft DTO and saves the next content version", async () => {
    const { customer, invitation } = await setupWorkspace();

    await expect(getWorkspaceInvitationDtoForCustomer(invitation.id, customer.id)).resolves.toMatchObject({
      invitationId: invitation.id,
      templateKey: "template-1",
      templateVersion: 1,
      contentSchemaVersion: 2,
      paletteKey: "gading",
      contentVersion: 0,
      draft: {},
    });

    await expect(
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: { draftNote: "first save" },
      }),
    ).resolves.toEqual({ status: "success", contentVersion: 1 });

    await expect(
      db.invitationContent.findUniqueOrThrow({ where: { invitationId: invitation.id } }),
    ).resolves.toMatchObject({ content: { draftNote: "first save" }, contentVersion: 1 });
  });

  it("allows only one concurrent save from the same version", async () => {
    const { customer, invitation } = await setupWorkspace();
    const results = await Promise.all([
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: { draftNote: "first writer" },
      }),
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: { draftNote: "second writer" },
      }),
    ]);

    expect(results.filter((result) => result.status === "success")).toHaveLength(1);
    expect(results.filter((result) => result.status === "conflict")).toHaveLength(1);
    await expect(db.invitationContent.findUniqueOrThrow({ where: { invitationId: invitation.id } })).resolves.toMatchObject({ contentVersion: 1 });
  });

  it("rejects locked, non-owned, and missing-runtime writes", async () => {
    const { customer, invitation } = await setupWorkspace();

    await db.invitation.update({ where: { id: invitation.id }, data: { editingEnabled: false } });
    await expect(
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: { draftNote: "locked" },
      }),
    ).resolves.toEqual({ status: "locked" });

    await expect(
      saveWorkspaceDraftForCustomer({
        customerId: "00000000-0000-0000-0000-000000000099",
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: { draftNote: "other customer" },
      }),
    ).resolves.toEqual({ status: "unavailable" });

    await db.invitation.update({
      where: { id: invitation.id },
      data: { editingEnabled: true, templateVersion: 99 },
    });
    await expect(
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: { draftNote: "missing runtime" },
      }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("fails closed when persisted schema data is incompatible", async () => {
    const { customer, invitation } = await setupWorkspace(999);

    await expect(getWorkspaceInvitationDtoForCustomer(invitation.id, customer.id)).rejects.toBeInstanceOf(
      WorkspaceUnavailableError,
    );
  });
});
