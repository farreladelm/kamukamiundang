import "server-only";

import { db } from "@/lib/server/db";
import {
  createOpaqueToken,
  hashOpaqueToken,
} from "./session";

export { createOpaqueToken, hashOpaqueToken };

export const MAGIC_LINK_TTL_MS = 24 * 60 * 60 * 1000;

type MagicLinkState = {
  consumedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
};

export function isMagicLinkUsable(link: MagicLinkState, now = new Date()): boolean {
  return !link.consumedAt && !link.revokedAt && link.expiresAt > now;
}

export async function issueMagicLink({
  invitationId,
  adminId,
  origin,
  now = new Date(),
}: {
  invitationId: string;
  adminId: string;
  origin: string;
  now?: Date;
}) {
  const rawToken = createOpaqueToken();
  const tokenHash = hashOpaqueToken(rawToken);

  const link = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} FOR UPDATE`;
    const invitation = await tx.invitation.findUnique({
      where: { id: invitationId },
      select: { id: true, customerId: true, status: true, archivedAt: true, editingEnabled: true },
    });

    if (
      !invitation ||
      invitation.status === "ARCHIVED" ||
      invitation.archivedAt ||
      !invitation.editingEnabled
    ) {
      throw new Error("Invitation not available");
    }

    await tx.magicLink.updateMany({
      where: { invitationId, consumedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });

    const created = await tx.magicLink.create({
      data: {
        tokenHash,
        customerId: invitation.customerId,
        invitationId,
        expiresAt: new Date(now.getTime() + MAGIC_LINK_TTL_MS),
      },
    });

    await tx.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: adminId,
        entityType: "MagicLink",
        entityId: created.id,
        action: "issued",
        properties: { invitationId },
      },
    });

    return created;
  });

  return {
    id: link.id,
    expiresAt: link.expiresAt,
    url: `${origin.replace(/\/$/, "")}/auth/magic/${rawToken}`,
    rawToken,
  };
}

export async function consumeMagicLink(token: string, now = new Date()) {
  const tokenHash = hashOpaqueToken(token);
  const rawSession = createOpaqueToken();

  return db.$transaction(async (tx) => {
    const result = await tx.magicLink.updateMany({
      where: {
        tokenHash,
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });

    if (result.count !== 1) {
      throw new Error("Magic link is invalid or expired");
    }

    const link = await tx.magicLink.findUniqueOrThrow({
      where: { tokenHash },
      select: { customerId: true, invitationId: true },
    });

    await tx.session.create({
      data: {
        tokenHash: hashOpaqueToken(rawSession),
        actorType: "CUSTOMER",
        customerId: link.customerId,
        expiresAt: new Date(now.getTime() + MAGIC_LINK_TTL_MS),
      },
    });

    return {
      sessionToken: rawSession,
      customerId: link.customerId,
      invitationId: link.invitationId,
    };
  });
}
