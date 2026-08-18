"use client";

import { useActionState, useState } from "react";
import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import { renderTemplate } from "@/features/templates/render-template";
import {
  initialWorkspaceSaveState,
  type WorkspaceSaveState,
} from "./action-state";
import {
  saveWorkspaceDraftAction,
} from "./actions";
import type { WorkspaceInvitationDto } from "@/features/invitations/workspace-dto";

export function WorkspaceEditor({ workspace }: { workspace: WorkspaceInvitationDto }) {
  const [saveState, formAction, pending] = useActionState<WorkspaceSaveState, FormData>(
    saveWorkspaceDraftAction,
    { ...initialWorkspaceSaveState, contentVersion: workspace.contentVersion },
  );
  const [rawContent, setRawContent] = useState(() => JSON.stringify(workspace.draft, null, 2));
  const runtime = getTemplateRuntimeManifest(workspace.templateKey, workspace.templateVersion);

  if (!runtime) {
    return <p role="alert">Runtime template tidak tersedia.</p>;
  }

  const selectedPalette = runtime.palettes.find((palette) => palette.key === workspace.paletteKey);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
      <section className="order-2 border border-stone-300 bg-white p-5 sm:p-7 xl:order-1">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Draft workspace</p>
          <h2 className="mt-2 font-serif text-3xl">Simpan perubahan</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Draft tersimpan dengan kontrol versi. Field invitation lengkap hadir pada tahap workspace berikutnya.
          </p>
        </div>

        <form action={formAction} className="mt-7 grid gap-4">
          <input type="hidden" name="invitationId" value={workspace.invitationId} />
          <input type="hidden" name="expectedContentVersion" value={saveState.contentVersion} />
          <div>
            <label htmlFor="workspace-draft-content" className="text-sm font-semibold">
              Draft JSON
            </label>
            <textarea
              id="workspace-draft-content"
              name="content"
              value={rawContent}
              onChange={(event) => setRawContent(event.target.value)}
              rows={14}
              spellCheck={false}
              className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-3 font-mono text-xs leading-5 focus-visible:outline-2"
              aria-describedby="workspace-draft-help"
            />
            <p id="workspace-draft-help" className="mt-2 text-xs leading-5 text-stone-500">
              Simpan object JSON valid. Input tetap dipertahankan jika validasi atau konflik versi gagal.
            </p>
          </div>
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
          {renderTemplate(runtime, workspace.paletteKey, runtime.demo.content)}
        </div>
      </section>
    </div>
  );
}
