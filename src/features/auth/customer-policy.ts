import "server-only";

import { db } from "@/lib/server/db";
import { requireCustomer } from "./policies";

export async function getOwnedEditableInvitation(
  invitationId: string,
  customerId: string,
) {
  const invitation = await db.invitation.findFirst({
    where: {
      id: invitationId,
      customerId,
      editingEnabled: true,
      status: { not: "ARCHIVED" },
    },
  });

  if (!invitation) throw new Error("Invitation access denied");
  return invitation;
}

export async function requireOwnedEditableInvitation(invitationId: string) {
  const { customer } = await requireCustomer();
  return getOwnedEditableInvitation(invitationId, customer.id);
}
