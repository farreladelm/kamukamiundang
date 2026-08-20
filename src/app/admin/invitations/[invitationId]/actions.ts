"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/policies";
import { issueMagicLink } from "@/features/auth/magic-link";
import {
  archiveInvitation,
  publishInvitation,
  setInvitationEditingEnabled,
  unpublishInvitation,
} from "@/features/invitations/publication";
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
  mutation: (adminId: string) => Promise<{ slug: string }>,
): Promise<InvitationPublicationActionResult> {
  const { admin } = await requireAdmin();
  try {
    const result = await mutation(admin.id);
    revalidatePath(`/admin/invitations/${invitationId}`);
    revalidatePath(`/i/${result.slug}`);
    return {};
  } catch {
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
