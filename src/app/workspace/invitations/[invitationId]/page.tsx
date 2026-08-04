import { notFound } from "next/navigation";
import { requireOwnedEditableInvitation } from "@/features/auth/customer-policy";

export default async function CustomerInvitationWorkspacePage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  let invitation;

  try {
    invitation = await requireOwnedEditableInvitation(invitationId);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Workspace customer</p>
      <h1 className="mt-3 font-serif text-5xl">Isi invitation</h1>
      <p className="mt-4 text-sm text-stone-600">{invitation.templateKey} v{invitation.templateVersion} · akses editing aktif.</p>
      <div className="mt-8 border border-stone-300 bg-white p-6 text-sm text-stone-600">Form konten tersedia pada slice workspace berikutnya.</div>
    </main>
  );
}
