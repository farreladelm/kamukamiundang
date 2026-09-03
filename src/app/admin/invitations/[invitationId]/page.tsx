import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import {
  archiveInvitationAction,
  issueInvitationMagicLinkAction,
  publishInvitationAction,
  setInvitationEditingEnabledAction,
  unpublishInvitationAction,
  updateInvitationSlugAction,
  type InvitationPublicationActionResult,
} from "./actions";
import { MagicLinkPanel, type MagicLinkActionState } from "@/features/auth/magic-link-panel";
import { InvitationPublicationControls } from "@/features/invitations/publication-controls";
import { InvitationSlugForm } from "@/features/invitations/invitation-slug-form";
import { type FormActionState } from "@/features/forms/action-state";

export default async function AdminInvitationPage({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params;
  const invitation = await db.invitation.findUnique({ where: { id: invitationId }, include: { customer: true, order: true } });
  if (!invitation) notFound();
  const editingEnabled = invitation.editingEnabled;

  async function issueLink(_state: MagicLinkActionState, _formData: FormData): Promise<MagicLinkActionState> {
    "use server";
    void _state;
    void _formData;
    return issueInvitationMagicLinkAction(invitationId);
  }

  async function mutatePublication(
    _state: InvitationPublicationActionResult,
    formData: FormData,
  ): Promise<InvitationPublicationActionResult> {
    "use server";
    switch (formData.get("intent")) {
      case "publish":
        return publishInvitationAction(invitationId);
      case "unpublish":
        return unpublishInvitationAction(invitationId);
      case "archive":
        return archiveInvitationAction(invitationId);
      case "toggle-editing":
        return setInvitationEditingEnabledAction(invitationId, !editingEnabled);
      default:
        return { error: "Aksi publikasi tidak valid." };
    }
  }

  async function updateSlug(
    state: FormActionState,
    formData: FormData,
  ): Promise<FormActionState> {
    "use server";
    return updateInvitationSlugAction(invitationId, state, formData);
  }

  return (
    <section className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Invitation</p>
      <h1 className="mt-2 font-serif text-5xl">{invitation.customer.name}</h1>
      <p className="mt-3 text-sm text-stone-600">
        {invitation.templateKey} v{invitation.templateVersion} · {invitation.status} · editing {invitation.editingEnabled ? "aktif" : "terkunci"}
      </p>
      {invitation.status === "PUBLISHED" && invitation.slug && (
        <a className="mt-3 inline-block text-sm font-semibold text-stone-800 underline underline-offset-4" href={`/i/${invitation.slug}`} target="_blank" rel="noreferrer">
          Buka invitation publik
        </a>
      )}
      {invitation.status === "DRAFT" ? (
        <InvitationSlugForm action={updateSlug} slug={invitation.slug} />
      ) : (
        <p className="mt-6 text-sm text-stone-600">
          {invitation.slug ? `URL publik: /i/${invitation.slug}` : "URL publik belum diatur"}
        </p>
      )}
      {invitation.status !== "ARCHIVED" && (
        <>
          <InvitationPublicationControls
            action={mutatePublication}
            editingEnabled={invitation.editingEnabled}
            hasSlug={Boolean(invitation.slug)}
            status={invitation.status}
          />
          <div className="mt-8"><MagicLinkPanel action={issueLink} /></div>
          <p className="mt-4 text-xs leading-5 text-stone-500">Link lama langsung dicabut. Link baru hanya tampil dari hasil aksi ini.</p>
        </>
      )}
    </section>
  );
}
