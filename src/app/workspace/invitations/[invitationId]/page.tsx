import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getWorkspaceInvitationDto,
} from "@/features/invitations/workspace-dto";
import { WorkspaceEditor } from "@/features/workspace/workspace-editor";

export default async function CustomerInvitationWorkspacePage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  let workspace;

  try {
    workspace = await getWorkspaceInvitationDto(invitationId);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto min-h-dvh max-w-7xl px-5 py-10 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Workspace customer</p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="mt-3 font-serif text-5xl">Isi invitation</h1>
        <Link
          href={`/workspace/invitations/${invitationId}/responses`}
          className="text-sm font-semibold text-stone-800 underline underline-offset-4 hover:text-stone-600"
        >
          Kelola RSVP dan ucapan
        </Link>
      </div>
      <p className="mt-4 text-sm text-stone-600">{workspace.templateKey} v{workspace.templateVersion} · akses editing aktif.</p>
      <div className="mt-8">
        <WorkspaceEditor workspace={workspace} />
      </div>
    </main>
  );
}
