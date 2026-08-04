"use client";

import { useActionState, useEffect, useState } from "react";
import { useAdminToast } from "@/features/admin/admin-toast";

export type MagicLinkActionState = { url?: string; error?: string };
type MagicLinkAction = (
  state: MagicLinkActionState,
  formData: FormData,
) => Promise<MagicLinkActionState>;

export function MagicLinkPanel({ action }: { action: MagicLinkAction }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useAdminToast();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.url) showToast("Magic link berhasil dibuat.");
    if (state.error) showToast(state.error, "error");
  }, [showToast, state.error, state.url]);

  async function copyLink() {
    if (!state.url) return;
    await navigator.clipboard.writeText(state.url);
    setCopied(true);
  }

  return (
    <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-stone-800">
      {!state.url && <p className="font-semibold">Buat tautan akses customer.</p>}
      {state.url && <><p className="font-semibold">Tautan dibuat. Salin sekarang.</p><div className="mt-3 flex gap-2">
        <input aria-label="Tautan magic link" readOnly value={state.url} className="min-w-0 flex-1 border border-stone-300 bg-white px-3 py-2 text-xs" />
        <button type="button" onClick={() => void copyLink()} className="bg-stone-900 px-3 py-2 text-xs font-semibold text-white">{copied ? "Tersalin" : "Salin"}</button>
      </div></>}
      {state.error && <p className="mt-3 text-sm text-red-800">{state.error}</p>}
      {!state.url && <form action={formAction} className="mt-3"><button type="submit" disabled={pending} className="bg-stone-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? "Membuat..." : "Buat tautan"}</button></form>}
      <p className="mt-2 text-xs text-stone-600">Tautan tidak disimpan atau ditampilkan ulang.</p>
    </div>
  );
}
