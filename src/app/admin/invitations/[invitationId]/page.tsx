import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import {
  archiveInvitationAction,
  issueInvitationMagicLinkAction,
  publishInvitationAction,
  setInvitationEditingEnabledAction,
  unpublishInvitationAction,
} from "./actions";
import { MagicLinkPanel, type MagicLinkActionState } from "@/features/auth/magic-link-panel";
import { ArchiveInvitationControl } from "@/features/invitations/archive-invitation-control";

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

  async function publish() {
    "use server";
    await publishInvitationAction(invitationId);
  }

  async function unpublish() {
    "use server";
    await unpublishInvitationAction(invitationId);
  }

  async function archive() {
    "use server";
    await archiveInvitationAction(invitationId);
  }

  async function toggleEditing() {
    "use server";
    await setInvitationEditingEnabledAction(invitationId, !editingEnabled);
  }

  return (
    <section className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Invitation</p>
      <h1 className="mt-2 font-serif text-5xl">{invitation.customer.name}</h1>
      <p className="mt-3 text-sm text-stone-600">
        {invitation.templateKey} v{invitation.templateVersion} · {invitation.status} · editing {invitation.editingEnabled ? "aktif" : "terkunci"}
      </p>
      {invitation.status !== "ARCHIVED" && (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={publish}>
              <button className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
                {invitation.status === "PUBLISHED" ? "Publish ulang" : "Publish"}
              </button>
            </form>
            {invitation.status === "PUBLISHED" && (
              <form action={unpublish}>
                <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800" type="submit">Batalkan publikasi</button>
              </form>
            )}
            <form action={toggleEditing}>
              <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800" type="submit">
                {invitation.editingEnabled ? "Kunci editing" : "Buka editing"}
              </button>
            </form>
            <ArchiveInvitationControl action={archive} />
          </div>
          <div className="mt-8"><MagicLinkPanel action={issueLink} /></div>
          <p className="mt-4 text-xs leading-5 text-stone-500">Link lama langsung dicabut. Link baru hanya tampil dari hasil aksi ini.</p>
        </>
      )}
    </section>
  );
}
