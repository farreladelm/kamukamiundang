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
      <h1 className="mt-3 font-serif text-5xl">Isi invitation</h1>
      <p className="mt-4 text-sm text-stone-600">{workspace.templateKey} v{workspace.templateVersion} · akses editing aktif.</p>
      <div className="mt-8">
        <WorkspaceEditor workspace={workspace} />
      </div>
    </main>
  );
}
