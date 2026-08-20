import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/server/db";
import { assertWorkspaceRuntime, validateWorkspaceDraft } from "./workspace-dto";

export class PublicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicationError";
  }
}

type PublicationResult = {
  action: "published" | "republished" | "unpublished" | "archived" | "editing-enabled" | "editing-locked";
  slug: string;
};

function toSnapshotContent(invitation: {
  templateKey: string;
  templateVersion: number;
  contentSchemaVersion: number;
  paletteKey: string;
  content: { content: unknown; contentSchemaVersion: number } | null;
}) {
  if (!invitation.content || invitation.content.contentSchemaVersion !== invitation.contentSchemaVersion) {
    throw new PublicationError("Draft invitation is unavailable.");
  }

  try {
    const runtime = assertWorkspaceRuntime(
      invitation.templateKey,
      invitation.templateVersion,
      invitation.contentSchemaVersion,
      invitation.paletteKey,
    );
    const draft = validateWorkspaceDraft(invitation.content.content);

    return {
      ...draft,
      story: runtime.capabilities.includes("story") ? draft.story : null,
      gift: runtime.capabilities.includes("gift") ? draft.gift : null,
    } as Prisma.InputJsonObject;
  } catch {
    throw new PublicationError("Draft invitation is incompatible with its pinned template.");
  }
}

export async function publishInvitation(invitationId: string, adminId: string): Promise<PublicationResult> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} FOR UPDATE`;
    const invitation = await tx.invitation.findUnique({
      where: { id: invitationId },
      include: { content: true },
    });
    if (!invitation || invitation.status === "ARCHIVED") {
      throw new PublicationError("Invitation cannot be published.");
    }

    const content = toSnapshotContent(invitation);
    const assets = await tx.asset.findMany({
      where: { invitationId: invitation.id, status: "READY" },
      select: { id: true },
    });
    const now = new Date();
    const snapshotData = {
      templateKey: invitation.templateKey,
      templateVersion: invitation.templateVersion,
      contentSchemaVersion: invitation.contentSchemaVersion,
      paletteKey: invitation.paletteKey,
      content,
      publishedAt: now,
      assets: {
        deleteMany: {},
        create: assets.map((asset) => ({ asset: { connect: { id: asset.id } } })),
      },
    };

    await tx.publishedSnapshot.upsert({
      where: { invitationId: invitation.id },
      create: {
        ...snapshotData,
        assets: { create: snapshotData.assets.create },
        invitationId: invitation.id,
      },
      update: snapshotData,
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "PUBLISHED",
        editingEnabled: false,
        publishedAt: now,
        archivedAt: null,
      },
    });

    const action = invitation.status === "PUBLISHED" ? "republished" : "published";
    await tx.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: adminId,
        entityType: "Invitation",
        entityId: invitation.id,
        action: action.toUpperCase(),
        properties: { snapshotAssetCount: assets.length },
      },
    });
    return { action, slug: invitation.slug };
  });
}

export async function setInvitationEditingEnabled(
  invitationId: string,
  adminId: string,
  editingEnabled: boolean,
): Promise<PublicationResult> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} FOR UPDATE`;
    const invitation = await tx.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.status === "ARCHIVED") {
      throw new PublicationError("Invitation editing cannot be changed.");
    }

    await tx.invitation.update({ where: { id: invitation.id }, data: { editingEnabled } });
    const action = editingEnabled ? "editing-enabled" : "editing-locked";
    await tx.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: adminId,
        entityType: "Invitation",
        entityId: invitation.id,
        action: action.toUpperCase(),
      },
    });
    return { action, slug: invitation.slug };
  });
}

export async function unpublishInvitation(invitationId: string, adminId: string): Promise<PublicationResult> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} FOR UPDATE`;
    const invitation = await tx.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.status !== "PUBLISHED") {
      throw new PublicationError("Invitation cannot be unpublished.");
    }

    await tx.invitation.update({ where: { id: invitation.id }, data: { status: "DRAFT" } });
    await tx.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: adminId,
        entityType: "Invitation",
        entityId: invitation.id,
        action: "UNPUBLISHED",
      },
    });
    return { action: "unpublished", slug: invitation.slug };
  });
}

export async function archiveInvitation(invitationId: string, adminId: string): Promise<PublicationResult> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} FOR UPDATE`;
    const invitation = await tx.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.status === "ARCHIVED") {
      throw new PublicationError("Invitation cannot be archived.");
    }

    const now = new Date();
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ARCHIVED", editingEnabled: false, archivedAt: now },
    });
    await tx.magicLink.updateMany({
      where: { invitationId: invitation.id, consumedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    await tx.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: adminId,
        entityType: "Invitation",
        entityId: invitation.id,
        action: "ARCHIVED",
      },
    });
    return { action: "archived", slug: invitation.slug };
  });
}
