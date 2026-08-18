"use client";

import type { WorkspaceDraft } from "@/features/invitations/content-schema";

type IdentitySectionProps = {
  draft: WorkspaceDraft;
  onChange: (draft: WorkspaceDraft) => void;
};

const inputClassName = "mt-2 min-h-11 w-full border border-stone-300 bg-stone-50 px-3 text-sm focus-visible:outline-2";

export function IdentitySection({ draft, onChange }: IdentitySectionProps) {
  function updatePartner(index: 0 | 1, field: "name" | "parents", value: string) {
    const profiles: WorkspaceDraft["profiles"] = [
      { ...draft.profiles[0] },
      { ...draft.profiles[1] },
    ];
    profiles[index] = { ...profiles[index], [field]: value };
    onChange({ ...draft, profiles });
  }

  return (
    <section aria-labelledby="workspace-identity-heading" className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Identitas</p>
        <h3 id="workspace-identity-heading" className="mt-2 font-serif text-2xl">Kedua mempelai</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold" htmlFor="workspace-first-name">
          Nama mempelai pertama
          <input
            id="workspace-first-name"
            name="firstName"
            value={draft.couple.firstName}
            onChange={(event) => onChange({
              ...draft,
              couple: { ...draft.couple, firstName: event.target.value },
            })}
            className={inputClassName}
          />
        </label>
        <label className="text-sm font-semibold" htmlFor="workspace-second-name">
          Nama mempelai kedua
          <input
            id="workspace-second-name"
            name="secondName"
            value={draft.couple.secondName}
            onChange={(event) => onChange({
              ...draft,
              couple: { ...draft.couple, secondName: event.target.value },
            })}
            className={inputClassName}
          />
        </label>
      </div>
      {[0, 1].map((index) => (
        <fieldset key={index} className="grid gap-4 border border-stone-200 p-4">
          <legend className="px-1 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
            Mempelai {index + 1}
          </legend>
          <label className="text-sm font-semibold" htmlFor={`workspace-profile-name-${index}`}>
            Nama lengkap
            <input
              id={`workspace-profile-name-${index}`}
              name={`profile${index + 1}Name`}
              value={draft.profiles[index].name}
              onChange={(event) => updatePartner(index as 0 | 1, "name", event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="text-sm font-semibold" htmlFor={`workspace-profile-parents-${index}`}>
            Nama orang tua
            <textarea
              id={`workspace-profile-parents-${index}`}
              name={`profile${index + 1}Parents`}
              value={draft.profiles[index].parents}
              onChange={(event) => updatePartner(index as 0 | 1, "parents", event.target.value)}
              rows={3}
              className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-3 text-sm focus-visible:outline-2"
            />
          </label>
        </fieldset>
      ))}
    </section>
  );
}
