"use client";

import type { WorkspaceDraft } from "@/features/invitations/content-schema";

type CopySectionProps = {
  draft: WorkspaceDraft;
  onChange: (draft: WorkspaceDraft) => void;
};

export function CopySection({ draft, onChange }: CopySectionProps) {
  return (
    <section aria-labelledby="workspace-copy-heading" className="grid gap-5 border-t border-stone-200 pt-7">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Copy</p>
        <h3 id="workspace-copy-heading" className="mt-2 font-serif text-2xl">Pesan undangan</h3>
      </div>
      <label className="text-sm font-semibold" htmlFor="workspace-quote">
        Kutipan
        <textarea
          id="workspace-quote"
          name="quote"
          value={draft.quote}
          onChange={(event) => onChange({ ...draft, quote: event.target.value })}
          rows={3}
          maxLength={2000}
          className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-3 text-sm leading-6 focus-visible:outline-2"
        />
      </label>
    </section>
  );
}
