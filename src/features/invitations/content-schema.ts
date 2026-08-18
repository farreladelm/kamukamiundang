import type { TemplateContentViewModel } from "@/features/templates/types";
import { z } from "zod";

const shortText = z.string().trim().max(100, "Maksimal 100 karakter.").default("");
const parentText = z.string().trim().max(300, "Maksimal 300 karakter.").default("");
const copyText = z.string().trim().max(2000, "Maksimal 2.000 karakter.").default("");

const partnerSchema = z.object({
  name: shortText,
  parents: parentText,
});

export const workspaceDraftSchema = z.object({
  couple: z.object({
    firstName: shortText,
    secondName: shortText,
  }).default(() => ({ firstName: "", secondName: "" })),
  profiles: z.tuple([partnerSchema, partnerSchema]).default((): [
    { name: string; parents: string },
    { name: string; parents: string },
  ] => [
    { name: "", parents: "" },
    { name: "", parents: "" },
  ]),
  opening: copyText,
  quote: copyText,
  closing: copyText,
});

export type WorkspaceDraft = z.infer<typeof workspaceDraftSchema>;

export const emptyWorkspaceDraft: WorkspaceDraft = workspaceDraftSchema.parse({});

function displayText(value: string, placeholder: string) {
  return value || placeholder;
}

/** Maps editable draft fields to safe preview placeholders until later workspace sections are configured. */
export function toTemplateContentViewModel(draft: WorkspaceDraft): TemplateContentViewModel {
  return {
    eyebrow: "Undangan pernikahan",
    cover: {
      title: "Undangan pernikahan",
      recipientLabel: "Kepada Yth.",
      recipientName: "Tamu undangan",
    },
    couple: {
      firstName: displayText(draft.couple.firstName, "Mempelai pertama"),
      secondName: displayText(draft.couple.secondName, "Mempelai kedua"),
    },
    profiles: [
      {
        name: displayText(draft.profiles[0].name, "Mempelai pertama"),
        role: "putri",
        parents: draft.profiles[0].parents,
      },
      {
        name: displayText(draft.profiles[1].name, "Mempelai kedua"),
        role: "putra",
        parents: draft.profiles[1].parents,
      },
    ],
    opening: draft.opening,
    quote: draft.quote,
    eventDate: "Tanggal acara akan ditambahkan",
    eventDateIso: "2099-01-01T00:00:00+00:00",
    events: [],
    closing: draft.closing,
    branding: "Undangan oleh Undango",
  };
}
