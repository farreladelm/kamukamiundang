"use client";

import { useActionState, useState } from "react";
import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import { renderTemplate } from "@/features/templates/render-template";
import {
  toTemplateContentViewModel,
  type WorkspaceDraft,
  workspaceDraftSchema,
} from "@/features/invitations/content-schema";
import {
  initialWorkspaceSaveState,
  type WorkspaceSaveState,
} from "./action-state";
import {
  saveWorkspaceDraftAction,
} from "./actions";
import type { WorkspaceInvitationDto } from "@/features/invitations/workspace-dto";
import { CopySection } from "./copy-section";
import { IdentitySection } from "./identity-section";

export function WorkspaceEditor({ workspace }: { workspace: WorkspaceInvitationDto }) {
  const [saveState, formAction, pending] = useActionState<WorkspaceSaveState, FormData>(
    saveWorkspaceDraftAction,
    { ...initialWorkspaceSaveState, contentVersion: workspace.contentVersion },
  );
  const [draft, setDraft] = useState<WorkspaceDraft>(() => workspace.draft);
  const runtime = getTemplateRuntimeManifest(workspace.templateKey, workspace.templateVersion);

  if (!runtime) {
    return <p role="alert">Runtime template tidak tersedia.</p>;
  }

  const selectedPalette = runtime.palettes.find((palette) => palette.key === workspace.paletteKey);
  const previewDraft = workspaceDraftSchema.safeParse(draft);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
      <section className="order-2 border border-stone-300 bg-white p-5 sm:p-7 xl:order-1">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Draft workspace</p>
          <h2 className="mt-2 font-serif text-3xl">Simpan perubahan</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Perubahan tersimpan dengan kontrol versi. Field lain hadir pada tahap workspace berikutnya.
          </p>
        </div>

        <form action={formAction} className="mt-7 grid gap-7">
          <input type="hidden" name="invitationId" value={workspace.invitationId} />
          <input type="hidden" name="expectedContentVersion" value={saveState.contentVersion} />
          <IdentitySection draft={draft} onChange={setDraft} />
          <CopySection draft={draft} onChange={setDraft} />
          <p className="text-xs leading-5 text-stone-500">
            Input tetap dipertahankan jika validasi atau konflik versi gagal.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 bg-stone-900 px-4 text-xs font-semibold tracking-[0.14em] text-white uppercase disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Menyimpan..." : "Simpan draft"}
          </button>
          {saveState.status !== "idle" && (
            <p
              role={saveState.status === "error" ? "alert" : "status"}
              className={saveState.status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}
            >
              {saveState.message}
            </p>
          )}
        </form>
      </section>

      <section className="order-1 min-w-0 xl:order-2">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Pinned preview</p>
            <h2 className="mt-2 font-serif text-3xl">{workspace.templateKey} v{workspace.templateVersion}</h2>
          </div>
          <p className="text-right text-xs text-stone-500">
            Palette: <span className="font-semibold text-stone-700">{selectedPalette?.name ?? workspace.paletteKey}</span>
            <br />
            Draft v{saveState.contentVersion}
          </p>
        </div>
        <div className="overflow-hidden border border-stone-300 bg-white shadow-sm">
          {previewDraft.success ? (
            renderTemplate(
              runtime,
              workspace.paletteKey,
              toTemplateContentViewModel(previewDraft.data, runtime.demo.content),
            )
          ) : (
            <p role="alert" className="p-5 text-sm text-red-700">Perbaiki isian sebelum melihat preview.</p>
          )}
        </div>
      </section>
    </div>
  );
}
