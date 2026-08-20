"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArchiveInvitationControl, type InvitationPublicationAction } from "./archive-invitation-control";

type InvitationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export function InvitationPublicationControls({
  action,
  editingEnabled,
  status,
}: {
  action: InvitationPublicationAction;
  editingEnabled: boolean;
  status: InvitationStatus;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) setActiveIntent(null);
    wasPending.current = pending;
  }, [pending]);

  if (status === "ARCHIVED") return null;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <form action={formAction}>
        <button className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} name="intent" onClick={() => setActiveIntent("publish")} type="submit" value="publish">
          {pending && activeIntent === "publish" ? "Mempublikasikan..." : status === "PUBLISHED" ? "Publish ulang" : "Publish"}
        </button>
      </form>
      {status === "PUBLISHED" && (
        <form action={formAction}>
          <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 disabled:opacity-50" disabled={pending} name="intent" onClick={() => setActiveIntent("unpublish")} type="submit" value="unpublish">
            {pending && activeIntent === "unpublish" ? "Membatalkan..." : "Batalkan publikasi"}
          </button>
        </form>
      )}
      <form action={formAction}>
        <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 disabled:opacity-50" disabled={pending} name="intent" onClick={() => setActiveIntent("toggle-editing")} type="submit" value="toggle-editing">
          {pending && activeIntent === "toggle-editing" ? "Menyimpan..." : editingEnabled ? "Kunci editing" : "Buka editing"}
        </button>
      </form>
      <ArchiveInvitationControl disabled={pending} formAction={formAction} isSubmitting={pending && activeIntent === "archive"} onConfirm={() => setActiveIntent("archive")} />
      {state.error && <p className="basis-full text-sm text-red-700" role="alert">{state.error}</p>}
    </div>
  );
}
