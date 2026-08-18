import type { TemplateContentViewModel } from "@/features/templates/types";
import { z } from "zod";

const shortText = z.string().trim().max(100, "Maksimal 100 karakter.").default("");
const parentText = z.string().trim().max(300, "Maksimal 300 karakter.").default("");
const copyText = z.string().trim().max(2000, "Maksimal 2.000 karakter.").default("");

const partnerSchema = z.object({
  nickname: shortText,
  fullName: shortText,
  fatherName: parentText,
  motherName: parentText,
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
  quote: copyText,
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

/** Maps editable draft fields to preview while retaining source-controlled template copy. */
export function toTemplateContentViewModel(
  draft: WorkspaceDraft,
  templateCopy: Pick<TemplateContentViewModel, "opening" | "closing">,
): TemplateContentViewModel {
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
    quote: draft.quote,
    eventDate: "Tanggal acara akan ditambahkan",
    eventDateIso: "2099-01-01T00:00:00+00:00",
    events: [],
    closing: templateCopy.closing,
    branding: "Undangan oleh Undango",
  };
}
