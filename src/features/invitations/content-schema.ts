import type { TemplateContentViewModel } from "@/features/templates/types";
import {
  defaultWeddingEvents,
  isAllowedMapsUrl,
  isIanaTimeZone,
  toEventInstant,
} from "./events";
import { z } from "zod";

const shortText = z.string().trim().max(100, "Maksimal 100 karakter.").default("");
const parentText = z.string().trim().max(300, "Maksimal 300 karakter.").default("");

const workspaceQuoteKeySchema = z.enum(["matthew-19-6", "ar-rum-21"]);

export type WorkspaceQuoteKey = z.infer<typeof workspaceQuoteKeySchema>;

export const workspaceQuoteOptions: ReadonlyArray<{
  key: WorkspaceQuoteKey;
  text: string;
  source: string;
}> = [
  {
    key: "matthew-19-6",
    text: "So they are no longer two, but one flesh. Therefore what God has joined together, let no one separate.",
    source: "Matthew 19:6",
  },
  {
    key: "ar-rum-21",
    text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
    source: "QS. Ar-Rum 21",
  },
];

const partnerSchema = z.object({
  nickname: shortText,
  fullName: shortText,
  fatherName: parentText,
  motherName: parentText,
});

const eventDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).default("");
const eventTimeSchema = z.string().regex(/^\d{2}:\d{2}$/).or(z.literal("")).default("");
const eventText = z.string().trim().max(300, "Maksimal 300 karakter.").default("");
const mapsUrlSchema = z.string().trim().max(2048, "Tautan Maps terlalu panjang.")
  .refine(isAllowedMapsUrl, "Gunakan tautan Google Maps HTTPS yang valid.")
  .default("");

const workspaceEventSchema = z.object({
  label: eventText,
  date: eventDateSchema,
  time: eventTimeSchema,
  timeZone: z.string().refine(isIanaTimeZone, "Timezone IANA tidak valid.").default("Asia/Jakarta"),
  venue: eventText,
  address: eventText,
  mapUrl: mapsUrlSchema,
});

export const workspaceDraftSchema = z.object({
  bride: partnerSchema.default(() => ({
    nickname: "",
    fullName: "",
    fatherName: "",
    motherName: "",
  })),
  groom: partnerSchema.default(() => ({
    nickname: "",
    fullName: "",
    fatherName: "",
    motherName: "",
  })),
  quoteKey: workspaceQuoteKeySchema.nullable().default(null),
  mainEvent: workspaceEventSchema.nullable().default(() => ({ ...defaultWeddingEvents.main })),
  secondaryEvent: workspaceEventSchema.nullable().default(() => ({ ...defaultWeddingEvents.secondary })),
});

export type WorkspaceDraft = z.infer<typeof workspaceDraftSchema>;

export const emptyWorkspaceDraft: WorkspaceDraft = workspaceDraftSchema.parse({});

function displayText(value: string, placeholder: string) {
  return value || placeholder;
}

function formatParents(
  role: "putra" | "putri",
  partner: WorkspaceDraft["bride"],
) {
  const parents = [
    partner.fatherName && `Bapak ${partner.fatherName}`,
    partner.motherName && `Ibu ${partner.motherName}`,
  ].filter(Boolean).join(" dan ");

  if (!parents) return "";
  return `${role === "putri" ? "Putri" : "Putra"} dari ${parents}`;
}

function getQuote(key: WorkspaceQuoteKey | null) {
  const quote = workspaceQuoteOptions.find((option) => option.key === key);
  return quote ? `${quote.text} — ${quote.source}` : "Pilih kutipan untuk preview.";
}

function formatEventDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatEventTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    hourCycle: "h23",
  }).format(date);
}

function toTemplateEvent(event: NonNullable<WorkspaceDraft["mainEvent"]>) {
  const instant = toEventInstant(event.date, event.time, event.timeZone);
  if (!instant || !event.label || !event.venue || !event.address || !event.mapUrl) return null;

  return {
    label: event.label,
    date: formatEventDate(instant, event.timeZone),
    time: formatEventTime(instant, event.timeZone),
    venue: event.venue,
    address: event.address,
    mapUrl: event.mapUrl,
    instant,
  };
}

/** Maps editable draft fields to preview while retaining source-controlled template copy. */
export function toTemplateContentViewModel(
  draft: WorkspaceDraft,
  templateCopy: Pick<TemplateContentViewModel, "opening" | "closing">,
): TemplateContentViewModel {
  const mainEvent = draft.mainEvent ? toTemplateEvent(draft.mainEvent) : null;
  const secondaryEvent = draft.secondaryEvent ? toTemplateEvent(draft.secondaryEvent) : null;
  const events = [mainEvent, secondaryEvent].filter((event): event is NonNullable<typeof event> => Boolean(event));
  const firstEvent = events[0];

  return {
    eyebrow: "Undangan pernikahan",
    cover: {
      title: "Undangan pernikahan",
      recipientLabel: "Kepada Yth.",
      recipientName: "Tamu undangan",
    },
    couple: {
      firstName: displayText(draft.bride.nickname, "Mempelai perempuan"),
      secondName: displayText(draft.groom.nickname, "Mempelai laki-laki"),
    },
    profiles: [
      {
        name: displayText(draft.bride.fullName || draft.bride.nickname, "Mempelai perempuan"),
        role: "putri",
        parents: formatParents("putri", draft.bride),
      },
      {
        name: displayText(draft.groom.fullName || draft.groom.nickname, "Mempelai laki-laki"),
        role: "putra",
        parents: formatParents("putra", draft.groom),
      },
    ],
    opening: templateCopy.opening,
    quote: getQuote(draft.quoteKey),
    eventDate: firstEvent ? firstEvent.date : "Tanggal acara akan ditambahkan",
    eventDateIso: firstEvent?.instant.toISOString() ?? "",
    events: events.map((event) => ({
      label: event.label,
      date: event.date,
      time: event.time,
      venue: event.venue,
      address: event.address,
      mapUrl: event.mapUrl,
    })),
    closing: templateCopy.closing,
    branding: "Undangan oleh Undango",
  };
}
