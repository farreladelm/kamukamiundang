"use server";

import { requireAdmin } from "@/features/auth/policies";
import { activatePaidOrder, transitionOrder } from "@/features/orders/activation";

export async function markOrderPaid(orderId: string) {
  await requireAdmin();
  const order = await transitionOrder(orderId, "PAID");
  return { id: order.id, status: order.status };
}

export async function activateOrder(orderId: string) {
  const { admin } = await requireAdmin();
  const invitation = await activatePaidOrder(orderId, admin.id);
  return { id: invitation.id, slug: invitation.slug };
}
