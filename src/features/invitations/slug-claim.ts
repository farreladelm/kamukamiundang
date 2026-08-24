import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export class InvitationSlugConflictError extends Error {
  constructor() {
    super("URL publik sudah digunakan.");
    this.name = "InvitationSlugConflictError";
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
