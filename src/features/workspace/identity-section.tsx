"use client";

import type { WorkspaceDraft } from "@/features/invitations/content-schema";

type IdentitySectionProps = {
  draft: WorkspaceDraft;
  onChange: (draft: WorkspaceDraft) => void;
};

const inputClassName = "mt-2 min-h-11 w-full border border-stone-300 bg-stone-50 px-3 text-sm focus-visible:outline-2";
const partners = [
  { key: "bride", label: "Mempelai perempuan" },
  { key: "groom", label: "Mempelai laki-laki" },
] as const;

export function IdentitySection({ draft, onChange }: IdentitySectionProps) {
  function updatePartner(
    partner: "bride" | "groom",
    field: "nickname" | "fullName" | "fatherName" | "motherName",
    value: string,
  ) {
    onChange({ ...draft, [partner]: { ...draft[partner], [field]: value } });
  }

  return (
    <section aria-labelledby="workspace-identity-heading" className="grid gap-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Identitas</p>
        <h3 id="workspace-identity-heading" className="mt-2 font-serif text-2xl">Kedua mempelai</h3>
      </div>
      {partners.map(({ key, label }) => (
        <fieldset key={key} className="grid gap-4 border border-stone-200 p-4">
          <legend className="px-1 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
            {label}
          </legend>
          <label className="text-sm font-semibold" htmlFor={`workspace-${key}-nickname`}>
            Nama panggilan
            <input
              id={`workspace-${key}-nickname`}
              name={`${key}Nickname`}
              value={draft[key].nickname}
              onChange={(event) => updatePartner(key, "nickname", event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="text-sm font-semibold" htmlFor={`workspace-${key}-full-name`}>
            Nama lengkap
            <input
              id={`workspace-${key}-full-name`}
              name={`${key}FullName`}
              value={draft[key].fullName}
              onChange={(event) => updatePartner(key, "fullName", event.target.value)}
              className={inputClassName}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold" htmlFor={`workspace-${key}-father`}>
              Nama ayah
              <input
                id={`workspace-${key}-father`}
                name={`${key}FatherName`}
                value={draft[key].fatherName}
                onChange={(event) => updatePartner(key, "fatherName", event.target.value)}
                className={inputClassName}
              />
            </label>
            <label className="text-sm font-semibold" htmlFor={`workspace-${key}-mother`}>
              Nama ibu
              <input
                id={`workspace-${key}-mother`}
                name={`${key}MotherName`}
                value={draft[key].motherName}
                onChange={(event) => updatePartner(key, "motherName", event.target.value)}
                className={inputClassName}
              />
            </label>
          </div>
        </fieldset>
      ))}
    </section>
  );
}
