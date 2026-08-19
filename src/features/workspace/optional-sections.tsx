"use client";

import type { WorkspaceDraft } from "@/features/invitations/content-schema";
import { MAX_GIFT_ACCOUNTS, MAX_STORY_ENTRIES } from "@/features/invitations/content-schema";

const inputClassName = "mt-2 min-h-11 w-full border border-stone-300 bg-stone-50 px-3 text-sm focus-visible:outline-2";

type OptionalSectionsProps = {
  draft: WorkspaceDraft;
  onChange: (draft: WorkspaceDraft) => void;
  canStory: boolean;
  canGift: boolean;
};

const emptyStory = () => ({ intro: "", entries: [] });
const emptyGift = () => ({ intro: "", accounts: [], physicalAddress: "" });

export function OptionalSections({ draft, onChange, canStory, canGift }: OptionalSectionsProps) {
  function updateStory(story: NonNullable<WorkspaceDraft["story"]>) {
    onChange({ ...draft, story });
  }

  function updateGift(gift: NonNullable<WorkspaceDraft["gift"]>) {
    onChange({ ...draft, gift });
  }

  return (
    <section aria-labelledby="workspace-optional-heading" className="grid gap-5 border-t border-stone-200 pt-7">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Tambahan</p>
        <h3 id="workspace-optional-heading" className="mt-2 font-serif text-2xl">Cerita dan hadiah</h3>
      </div>
      {canStory && (
        <fieldset className="grid gap-4 border border-stone-200 p-4">
          <legend className="px-1 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">Cerita cinta</legend>
          {!draft.story ? (
            <button type="button" onClick={() => updateStory(emptyStory())} className="justify-self-start border border-stone-300 px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase">Tambah cerita</button>
          ) : (
            <>
              <input type="hidden" name="storyEnabled" value="true" />
              <input type="hidden" name="storyEntryCount" value={draft.story.entries.length} />
              <label className="text-sm font-semibold" htmlFor="story-intro">Pembuka cerita (opsional)
                <textarea id="story-intro" name="storyIntro" value={draft.story.intro} onChange={(event) => updateStory({ ...draft.story!, intro: event.target.value })} rows={3} className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-3 text-sm leading-6" />
              </label>
              {draft.story.entries.map((entry, index) => (
                <fieldset key={index} className="grid gap-3 border border-stone-200 p-3">
                  <legend className="px-1 text-xs font-semibold text-stone-500">Bab {index + 1}</legend>
                  <input type="hidden" name={`storyEntryIndex_${index}`} value={index} />
                  <label className="text-sm font-semibold" htmlFor={`story-title-${index}`}>Judul bab
                    <input id={`story-title-${index}`} name={`storyEntryTitle_${index}`} value={entry.title} onChange={(event) => updateStory({ ...draft.story!, entries: draft.story!.entries.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} className={inputClassName} />
                  </label>
                  <label className="text-sm font-semibold" htmlFor={`story-text-${index}`}>Teks cerita
                    <textarea id={`story-text-${index}`} name={`storyEntryText_${index}`} value={entry.text} onChange={(event) => updateStory({ ...draft.story!, entries: draft.story!.entries.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) })} rows={4} className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-3 text-sm leading-6" />
                  </label>
                  <button type="button" onClick={() => updateStory({ ...draft.story!, entries: draft.story!.entries.filter((_, itemIndex) => itemIndex !== index) })} className="justify-self-start text-xs font-semibold underline underline-offset-4">Hapus bab</button>
                </fieldset>
              ))}
              {draft.story.entries.length < MAX_STORY_ENTRIES && <button type="button" onClick={() => updateStory({ ...draft.story!, entries: [...draft.story!.entries, { title: "", text: "" }] })} className="justify-self-start border border-stone-300 px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase">Tambah bab</button>}
              <button type="button" onClick={() => onChange({ ...draft, story: null })} className="justify-self-start text-xs font-semibold underline underline-offset-4">Hapus cerita</button>
            </>
          )}
        </fieldset>
      )}
      {canGift && (
        <fieldset className="grid gap-4 border border-stone-200 p-4">
          <legend className="px-1 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">Hadiah</legend>
          {!draft.gift ? (
            <button type="button" onClick={() => updateGift(emptyGift())} className="justify-self-start border border-stone-300 px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase">Tambah informasi hadiah</button>
          ) : (
            <>
              <input type="hidden" name="giftEnabled" value="true" />
              <input type="hidden" name="giftAccountCount" value={draft.gift.accounts.length} />
              {draft.gift.accounts.map((account, index) => (
                <fieldset key={index} className="grid gap-3 border border-stone-200 p-3">
                  <legend className="px-1 text-xs font-semibold text-stone-500">Rekening {index + 1}</legend>
                  <input type="hidden" name={`giftAccountIndex_${index}`} value={index} />
                  {(["bank", "accountNumber", "accountName"] as const).map((field) => <label key={field} className="text-sm font-semibold" htmlFor={`gift-${field}-${index}`}>{field === "bank" ? "Bank" : field === "accountNumber" ? "Nomor rekening" : "Nama pemilik rekening"}
                    <input id={`gift-${field}-${index}`} name={`giftAccount${field[0].toUpperCase()}${field.slice(1)}_${index}`} value={account[field]} onChange={(event) => updateGift({ ...draft.gift!, accounts: draft.gift!.accounts.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: event.target.value } : item) })} className={inputClassName} />
                  </label>)}
                  <button type="button" onClick={() => updateGift({ ...draft.gift!, accounts: draft.gift!.accounts.filter((_, itemIndex) => itemIndex !== index) })} className="justify-self-start text-xs font-semibold underline underline-offset-4">Hapus rekening</button>
                </fieldset>
              ))}
              {draft.gift.accounts.length < MAX_GIFT_ACCOUNTS && <button type="button" onClick={() => updateGift({ ...draft.gift!, accounts: [...draft.gift!.accounts, { bank: "", accountNumber: "", accountName: "" }] })} className="justify-self-start border border-stone-300 px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase">Tambah rekening</button>}
              <label className="text-sm font-semibold" htmlFor="gift-physical-address">Alamat kado fisik (opsional)
                <textarea id="gift-physical-address" name="giftPhysicalAddress" value={draft.gift.physicalAddress} onChange={(event) => updateGift({ ...draft.gift!, physicalAddress: event.target.value })} rows={3} className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-3 text-sm leading-6" />
              </label>
              <button type="button" onClick={() => onChange({ ...draft, gift: null })} className="justify-self-start text-xs font-semibold underline underline-offset-4">Hapus informasi hadiah</button>
            </>
          )}
        </fieldset>
      )}
    </section>
  );
}
