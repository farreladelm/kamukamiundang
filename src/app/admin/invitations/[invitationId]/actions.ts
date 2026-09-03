"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/policies";
import { issueMagicLink } from "@/features/auth/magic-link";
import {
  archiveInvitation,
  InvitationSlugRequiredError,
  publishInvitation,
  setInvitationEditingEnabled,
  unpublishInvitation,
} from "@/features/invitations/publication";
import {
  InvitationSlugConflictError,
  InvitationSlugStateError,
  updateDraftInvitationSlug,
} from "@/features/invitations/slug-claim";
import { formErrorState, initialFormActionState, type FormActionState } from "@/features/forms/action-state";
import { invitationSlugSchema } from "@/features/forms/schemas";
import { getApplicationOrigin } from "@/lib/server/env";

export type MagicLinkIssueResult = { url?: string; error?: string };
export type InvitationPublicationActionResult = { error?: string };

export async function issueInvitationMagicLinkAction(
  invitationId: string,
): Promise<MagicLinkIssueResult> {
  const { admin } = await requireAdmin();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  try {
    const result = await issueMagicLink({
      invitationId,
      adminId: admin.id,
      origin: getApplicationOrigin(`${protocol}://${host}`),
    });
    return { url: result.url };
  } catch {
    return { error: "Invitation tidak tersedia untuk link baru." };
  }
}

async function runPublicationAction(
  invitationId: string,
  mutation: (adminId: string) => Promise<{ slug: string | null }>,
): Promise<InvitationPublicationActionResult> {
  const { admin } = await requireAdmin();
  try {
    const result = await mutation(admin.id);
    revalidatePath(`/admin/invitations/${invitationId}`);
    if (result.slug) revalidatePath(`/i/${result.slug}`);
    return {};
  } catch (error) {
    if (error instanceof InvitationSlugRequiredError) return { error: error.message };
    return { error: "Perubahan publikasi tidak dapat disimpan." };
  }
}

export async function publishInvitationAction(invitationId: string) {
  return runPublicationAction(invitationId, (adminId) => publishInvitation(invitationId, adminId));
}

export async function unpublishInvitationAction(invitationId: string) {
  return runPublicationAction(invitationId, (adminId) => unpublishInvitation(invitationId, adminId));
}

export async function archiveInvitationAction(invitationId: string) {
  return runPublicationAction(invitationId, (adminId) => archiveInvitation(invitationId, adminId));
}

export async function setInvitationEditingEnabledAction(invitationId: string, editingEnabled: boolean) {
  return runPublicationAction(invitationId, (adminId) => setInvitationEditingEnabled(invitationId, adminId, editingEnabled));
}

export async function updateInvitationSlugAction(
  invitationId: string,
  _previousState: FormActionState = initialFormActionState,
  formData?: FormData,
): Promise<FormActionState> {
  void _previousState;
  const { admin } = await requireAdmin();
  const parsed = invitationSlugSchema.safeParse(formData?.get("slug"));
  if (!parsed.success) {
    return formErrorState("Periksa kembali URL publik.", {
      slug: [parsed.error.issues[0]?.message ?? "URL publik tidak valid."],
    });
  }

  try {
    const result = await updateDraftInvitationSlug({ invitationId, adminId: admin.id, slug: parsed.data });
    revalidatePath(`/admin/invitations/${invitationId}`);
    if (result.previousSlug) revalidatePath(`/i/${result.previousSlug}`);
    revalidatePath(`/i/${result.slug}`);
    return { ...initialFormActionState, status: "success", message: "URL publik berhasil disimpan." };
  } catch (error) {
    if (error instanceof InvitationSlugConflictError || error instanceof InvitationSlugStateError) {
      return formErrorState(error.message, { slug: [error.message] });
    }
    return formErrorState("URL publik tidak dapat disimpan.");
  }
}
