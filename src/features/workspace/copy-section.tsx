"use client";

import type { WorkspaceDraft } from "@/features/invitations/content-schema";

type CopySectionProps = {
  draft: WorkspaceDraft;
  onChange: (draft: WorkspaceDraft) => void;
};

const copyFields = [
  { key: "opening", label: "Pesan pembuka" },
  { key: "quote", label: "Kutipan" },
  { key: "closing", label: "Pesan penutup" },
] as const;

export function CopySection({ draft, onChange }: CopySectionProps) {
  return (
    <section aria-labelledby="workspace-copy-heading" className="grid gap-5 border-t border-stone-200 pt-7">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Copy</p>
        <h3 id="workspace-copy-heading" className="mt-2 font-serif text-2xl">Pesan undangan</h3>
      </div>
      {copyFields.map(({ key, label }) => (
        <label key={key} className="text-sm font-semibold" htmlFor={`workspace-${key}`}>
          {label}
          <textarea
            id={`workspace-${key}`}
            name={key}
            value={draft[key]}
            onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
            rows={key === "quote" ? 3 : 4}
            maxLength={2000}
            className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-3 text-sm leading-6 focus-visible:outline-2"
          />
        </label>
      ))}
    </section>
  );
}
