"use client";

import type { WorkspaceDraft } from "@/features/invitations/content-schema";
import { workspaceQuoteOptions } from "@/features/invitations/content-schema";

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
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">Kutipan</legend>
        {workspaceQuoteOptions.map((option) => (
          <label key={option.key} className="flex cursor-pointer gap-3 border border-stone-300 bg-stone-50 p-4 text-sm leading-6">
            <input
              type="radio"
              name="quoteKey"
              value={option.key}
              checked={draft.quoteKey === option.key}
              onChange={() => onChange({ ...draft, quoteKey: option.key })}
              className="mt-1 size-4 shrink-0"
            />
            <span>
              <span className="block font-semibold">{option.source}</span>
              {option.text}
            </span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
