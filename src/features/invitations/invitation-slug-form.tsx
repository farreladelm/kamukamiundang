"use client";

import { useActionState } from "react";
import { initialFormActionState, type FormActionState } from "@/features/forms/action-state";

export function InvitationSlugForm({
  action,
  slug,
}: {
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>;
  slug: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormActionState);
  const error = state.fieldErrors.slug?.[0];

  return (
    <form action={formAction} className="mt-6 grid gap-3 border border-stone-300 bg-white p-4">
      <label className="grid gap-2 text-sm font-medium" htmlFor="invitation-slug">
        URL publik
        <span className="text-xs font-normal text-stone-500">/i/ gunakan huruf kecil, angka, dan tanda hubung.</span>
        <input id="invitation-slug" name="slug" defaultValue={slug ?? ""} autoCapitalize="none" aria-describedby={error ? "invitation-slug-error" : undefined} aria-invalid={Boolean(error)} className="min-h-11 border border-stone-300 px-3 aria-[invalid=true]:border-red-700" />
      </label>
      {error && <p id="invitation-slug-error" className="text-xs text-red-800" role="alert">{error}</p>}
      <button className="min-h-11 w-fit bg-stone-900 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
        {pending ? "Menyimpan..." : "Simpan URL publik"}
      </button>
    </form>
  );
}
