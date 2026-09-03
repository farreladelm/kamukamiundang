import "server-only";

import { assertInvitationSlugAvailable } from "@/features/invitations/slug-claim";
import { db } from "@/lib/server/db";
import { assertOrderTransition } from "./policies";

export async function transitionOrder(
  orderId: string,
  nextStatus: "PAID" | "ACTIVATED" | "CANCELLED" | "REFUNDED",
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.status === nextStatus) return order;

  assertOrderTransition(order.status, nextStatus);

  return db.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      ...(nextStatus === "PAID" ? { paidAt: new Date() } : {}),
      ...(nextStatus === "REFUNDED" ? { refundedAt: new Date() } : {}),
    },
  });
}

export async function activatePaidOrder(orderId: string, adminId: string) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;

    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    if (order.status === "ACTIVATED") {
      const existingInvitation = await tx.invitation.findUnique({ where: { orderId } });
      if (!existingInvitation) throw new Error("Activated order has no invitation");
      return existingInvitation;
    }

    if (order.status !== "PAID") {
      throw new Error("Only paid orders can be activated");
    }

    if (order.requestedInvitationSlug) {
      await assertInvitationSlugAvailable(tx, order.requestedInvitationSlug, { orderId: order.id });
    }

    const invitation = await tx.invitation.create({
      data: {
        customerId: order.customerId,
        orderId: order.id,
        templateKey: order.templateKey,
        templateVersion: order.templateVersion,
        contentSchemaVersion: order.contentSchemaVersion,
        paletteKey: order.paletteKey,
        slug: order.requestedInvitationSlug,
      },
    });

    await tx.invitationContent.create({
      data: {
        invitationId: invitation.id,
        content: {},
        contentSchemaVersion: order.contentSchemaVersion,
        updatedByActorType: "ADMIN",
        updatedByActorId: adminId,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: "ACTIVATED", activatedAt: new Date() },
    });

    return invitation;
  });
}
