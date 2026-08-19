import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import {
  getWorkspaceInvitationDtoForCustomer,
  WorkspaceUnavailableError,
} from "@/features/invitations/workspace-dto";
import { saveWorkspaceDraftForCustomer } from "@/features/workspace/actions";
import {
  emptyWorkspaceDraft,
  type WorkspaceDraft,
} from "@/features/invitations/content-schema";

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer", "Admin" CASCADE',
  );
});

async function setupWorkspace(
  contentSchemaVersion = 2,
  draftContent: Record<string, string> = {},
) {
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
       content: draftContent,
      contentSchemaVersion: invitation.contentSchemaVersion,
      updatedByActorType: "ADMIN",
      updatedByActorId: customer.id,
    },
  });

  return { customer, invitation };
}

function workspaceDraft(): WorkspaceDraft {
  return {
    bride: { nickname: "Rani", fullName: "Rani Prameswari", fatherName: "Hadi", motherName: "Rani" },
    groom: { nickname: "Dimas", fullName: "Dimas Adinata", fatherName: "Surya", motherName: "Ratih" },
    quoteKey: "matthew-19-6",
  };
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
       draft: emptyWorkspaceDraft,
    });

    await expect(
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: workspaceDraft(),
      }),
    ).resolves.toEqual({ status: "success", contentVersion: 1 });

    await expect(
      db.invitationContent.findUniqueOrThrow({ where: { invitationId: invitation.id } }),
    ).resolves.toMatchObject({
      content: workspaceDraft(),
      contentVersion: 1,
    });
  });

  it("allows only one concurrent save from the same version", async () => {
    const { customer, invitation } = await setupWorkspace();
    const results = await Promise.all([
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: workspaceDraft(),
      }),
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: workspaceDraft(),
      }),
    ]);

    expect(results.filter((result) => result.status === "success")).toHaveLength(1);
    expect(results.filter((result) => result.status === "conflict")).toHaveLength(1);
    await expect(db.invitationContent.findUniqueOrThrow({ where: { invitationId: invitation.id } })).resolves.toMatchObject({ contentVersion: 1 });
  });

  it("preserves unsupported MVP-19 JSON when saving a typed draft", async () => {
    const legacyDraft = { draftNote: "keep this MVP-19 data" };
    const { customer, invitation } = await setupWorkspace(2, legacyDraft);

    await expect(
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: workspaceDraft(),
      }),
    ).resolves.toEqual({ status: "success", contentVersion: 1 });

    await expect(
      db.invitationContent.findUniqueOrThrow({ where: { invitationId: invitation.id } }),
    ).resolves.toMatchObject({
      content: {
        ...workspaceDraft(),
        legacyMvp19Draft: legacyDraft,
      },
    });
  });

  it("rejects locked, non-owned, and missing-runtime writes", async () => {
    const { customer, invitation } = await setupWorkspace();

    await db.invitation.update({ where: { id: invitation.id }, data: { editingEnabled: false } });
    await expect(
      saveWorkspaceDraftForCustomer({
        customerId: customer.id,
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: workspaceDraft(),
      }),
    ).resolves.toEqual({ status: "locked" });

    await expect(
      saveWorkspaceDraftForCustomer({
        customerId: "00000000-0000-0000-0000-000000000099",
        invitationId: invitation.id,
        expectedContentVersion: 0,
        content: workspaceDraft(),
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
        content: workspaceDraft(),
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
