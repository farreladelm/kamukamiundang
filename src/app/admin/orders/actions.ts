"use server";

import { requireAdmin } from "@/features/auth/policies";
import { InvitationSlugConflictError } from "@/features/invitations/slug-claim";
import { activatePaidOrder, transitionOrder } from "@/features/orders/activation";
import { createPendingOrder, parseTemplateSelection } from "@/features/orders/data";
import { formDataToObject, orderIntakeSchema } from "@/features/forms/schemas";
import {
  type FormActionState,
  formErrorState,
  initialFormActionState,
  successState,
  zodErrorState,
} from "@/features/forms/action-state";

export async function createPendingOrderAction(
  _previousState: FormActionState = initialFormActionState,
  formData?: FormData,
): Promise<FormActionState> {
  void _previousState;
  const parsed = orderIntakeSchema.safeParse(formDataToObject(formData ?? new FormData()));
  if (!parsed.success) return zodErrorState(parsed.error);

  await requireAdmin();

  let selection: ReturnType<typeof parseTemplateSelection> | undefined;
  try {
    selection = parseTemplateSelection(parsed.data.templateSelection);
    const order = await createPendingOrder({
      customer: {
        customerId: parsed.data.customerId || undefined,
        name: parsed.data.customerName,
        whatsapp: parsed.data.whatsapp || undefined,
        email: parsed.data.email || undefined,
      },
      templateKey: selection.templateKey,
      templateVersion: selection.templateVersion,
      paletteKey: selection.paletteKey,
      photoLimit: parsed.data.photoLimit,
      requestedInvitationSlug: parsed.data.requestedInvitationSlug,
    });

    return successState(`Order pending untuk ${order.customer.name} berhasil disimpan.`);
  } catch (error) {
    if (error instanceof InvitationSlugConflictError) {
      return formErrorState(error.message, { requestedInvitationSlug: [error.message] });
    }
    return formErrorState(
      "Order tidak dapat disimpan. Periksa template dan data customer.",
      selection ? {} : { templateSelection: ["Template dan palette tidak valid."] },
    );
  }
}

export async function markOrderPaidAction(orderId: string) {
  await requireAdmin();
  const order = await transitionOrder(orderId, "PAID");
  return { id: order.id, status: order.status };
}

export async function activateOrderAction(orderId: string) {
  const { admin } = await requireAdmin();
  const invitation = await activatePaidOrder(orderId, admin.id);
  return { id: invitation.id, slug: invitation.slug };
}
