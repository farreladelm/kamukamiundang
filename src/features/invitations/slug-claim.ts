import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/server/db";

export class InvitationSlugConflictError extends Error {
  constructor() {
    super("URL publik sudah digunakan.");
    this.name = "InvitationSlugConflictError";
  }
}

export class InvitationSlugStateError extends Error {
  constructor() {
    super("URL publik hanya dapat diubah saat invitation masih draft.");
    this.name = "InvitationSlugStateError";
  }
}

type CurrentSlugOwner = {
  orderId?: string;
  invitationId?: string;
};

export async function assertInvitationSlugAvailable(
  tx: Prisma.TransactionClient,
  slug: string,
  currentOwner: CurrentSlugOwner = {},
) {
  // A transaction-scoped lock serializes claims spanning both tables.
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${slug}, 0))`;

  const [order, invitation] = await Promise.all([
    tx.order.findFirst({
      where: {
        requestedInvitationSlug: slug,
        ...(currentOwner.orderId ? { id: { not: currentOwner.orderId } } : {}),
      },
      select: { id: true },
    }),
    tx.invitation.findFirst({
      where: {
        slug,
        ...(currentOwner.invitationId ? { id: { not: currentOwner.invitationId } } : {}),
      },
      select: { id: true },
    }),
  ]);

  if (order || invitation) throw new InvitationSlugConflictError();
}

export async function updateDraftInvitationSlug({
  invitationId,
  adminId,
  slug,
}: {
  invitationId: string;
  adminId: string;
  slug: string;
}) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "id" = ${invitationId} FOR UPDATE`;
    const invitation = await tx.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.status !== "DRAFT") throw new InvitationSlugStateError();

    await assertInvitationSlugAvailable(tx, slug, {
      orderId: invitation.orderId,
      invitationId: invitation.id,
    });
    await Promise.all([
      tx.order.update({
        where: { id: invitation.orderId },
        data: { requestedInvitationSlug: slug },
      }),
      tx.invitation.update({ where: { id: invitation.id }, data: { slug } }),
    ]);
    await tx.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: adminId,
        entityType: "Invitation",
        entityId: invitation.id,
        action: "SLUG_UPDATED",
        properties: { previousSlug: invitation.slug, slug },
      },
    });

    return { previousSlug: invitation.slug, slug };
  });
}
