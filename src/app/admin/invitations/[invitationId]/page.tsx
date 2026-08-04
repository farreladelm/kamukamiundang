import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { issueInvitationMagicLinkAction } from "./actions";
import { MagicLinkPanel, type MagicLinkActionState } from "@/features/auth/magic-link-panel";

export default async function AdminInvitationPage({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params;
  const invitation = await db.invitation.findUnique({ where: { id: invitationId }, include: { customer: true, order: true } });
  if (!invitation) notFound();

  async function issueLink(_state: MagicLinkActionState, _formData: FormData): Promise<MagicLinkActionState> {
    "use server";
    void _state;
    void _formData;
    return issueInvitationMagicLinkAction(invitationId);
  }

  return (
    <section className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Invitation</p>
      <h1 className="mt-2 font-serif text-5xl">{invitation.customer.name}</h1>
      <p className="mt-3 text-sm text-stone-600">{invitation.templateKey} v{invitation.templateVersion} · {invitation.status} · editing {invitation.editingEnabled ? "aktif" : "terkunci"}</p>
      <div className="mt-8"><MagicLinkPanel action={issueLink} /></div>
      <p className="mt-4 text-xs leading-5 text-stone-500">Link lama langsung dicabut. Link baru hanya tampil dari hasil aksi ini.</p>
    </section>
  );
}
