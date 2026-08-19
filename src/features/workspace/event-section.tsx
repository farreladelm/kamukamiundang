"use client";

import { defaultWeddingEvents, indonesianTimeZones } from "@/features/invitations/events";
import type { WorkspaceDraft } from "@/features/invitations/content-schema";

type EventSectionProps = {
  draft: WorkspaceDraft;
  onChange: (draft: WorkspaceDraft) => void;
  errors: Record<string, string>;
};

type EventKey = "mainEvent" | "secondaryEvent";
type EventField = keyof NonNullable<WorkspaceDraft["mainEvent"]>;

const inputClassName = "mt-2 min-h-11 w-full border border-stone-300 bg-stone-50 px-3 text-sm focus-visible:outline-2";

export function EventSection({ draft, onChange, errors }: EventSectionProps) {
  function defaultEvent(key: EventKey) {
    return { ...(key === "mainEvent" ? defaultWeddingEvents.main : defaultWeddingEvents.secondary) };
  }

  function updateEvent(key: EventKey, field: EventField, value: string) {
    const current = draft[key] ?? defaultEvent(key);
    onChange({ ...draft, [key]: { ...current, [field]: value } });
  }

  function eventFields(key: EventKey, title: string) {
    const event = draft[key];
    if (!event) return null;

    return (
      <fieldset className="grid gap-4 border border-stone-200 p-4">
        <legend className="px-1 text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">{title}</legend>
        <label className="text-sm font-semibold" htmlFor={`${key}-label`}>
          Nama acara
          <input id={`${key}-label`} name={`${key}Label`} value={event.label} onChange={(input) => updateEvent(key, "label", input.target.value)} className={inputClassName} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold" htmlFor={`${key}-date`}>
            Tanggal
            <input id={`${key}-date`} name={`${key}Date`} type="date" value={event.date} onChange={(input) => updateEvent(key, "date", input.target.value)} className={inputClassName} />
          </label>
          <label className="text-sm font-semibold" htmlFor={`${key}-time`}>
            Waktu
            <input id={`${key}-time`} name={`${key}Time`} type="time" value={event.time} onChange={(input) => updateEvent(key, "time", input.target.value)} className={inputClassName} />
          </label>
        </div>
        <label className="text-sm font-semibold" htmlFor={`${key}-time-zone`}>
          Zona waktu
          <select id={`${key}-time-zone`} name={`${key}TimeZone`} value={event.timeZone} onChange={(input) => updateEvent(key, "timeZone", input.target.value)} className={inputClassName}>
            {indonesianTimeZones.map((timeZone) => <option key={timeZone.value} value={timeZone.value}>{timeZone.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold" htmlFor={`${key}-venue`}>
          Venue
          <input id={`${key}-venue`} name={`${key}Venue`} value={event.venue} onChange={(input) => updateEvent(key, "venue", input.target.value)} className={inputClassName} />
        </label>
        <label className="text-sm font-semibold" htmlFor={`${key}-address`}>
          Alamat
          <textarea id={`${key}-address`} name={`${key}Address`} value={event.address} onChange={(input) => updateEvent(key, "address", input.target.value)} rows={3} className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-3 text-sm leading-6 focus-visible:outline-2" />
        </label>
        <label className="text-sm font-semibold" htmlFor={`${key}-map-url`}>
          Tautan Google Maps
          <input
            id={`${key}-map-url`}
            name={`${key}MapUrl`}
            type="url"
            value={event.mapUrl}
            onChange={(input) => updateEvent(key, "mapUrl", input.target.value)}
            aria-invalid={Boolean(errors[`${key}.mapUrl`])}
            aria-describedby={errors[`${key}.mapUrl`] ? `${key}-map-url-error` : undefined}
            className={inputClassName}
          />
          {errors[`${key}.mapUrl`] && <p id={`${key}-map-url-error`} role="alert" className="mt-2 text-xs font-normal text-red-700">{errors[`${key}.mapUrl`]}</p>}
        </label>
        <button type="button" onClick={() => onChange({ ...draft, [key]: null })} className="justify-self-start text-xs font-semibold underline underline-offset-4">
          Hapus {key === "mainEvent" ? "akad nikah" : "resepsi"}
        </button>
      </fieldset>
    );
  }

  return (
    <section aria-labelledby="workspace-events-heading" className="grid gap-5 border-t border-stone-200 pt-7">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Acara dan lokasi</p>
        <h3 id="workspace-events-heading" className="mt-2 font-serif text-2xl">Rangkaian perayaan</h3>
        <p className="mt-2 text-xs leading-5 text-stone-500">
          Preview acara dan venue tampil setelah nama acara, tanggal, waktu, venue, alamat, dan tautan Google Maps terisi valid.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => onChange({ ...draft, mainEvent: defaultEvent("mainEvent"), secondaryEvent: defaultEvent("secondaryEvent") })} className="border border-stone-300 px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase">Reset acara default</button>
        {!draft.mainEvent && <button type="button" onClick={() => onChange({ ...draft, mainEvent: defaultEvent("mainEvent") })} className="border border-stone-300 px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase">Tambah akad nikah</button>}
        {!draft.secondaryEvent && <button type="button" onClick={() => onChange({ ...draft, secondaryEvent: defaultEvent("secondaryEvent") })} className="border border-stone-300 px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase">Tambah resepsi</button>}
      </div>
      {eventFields("mainEvent", "Akad nikah")}
      {eventFields("secondaryEvent", "Resepsi")}
    </section>
  );
}
