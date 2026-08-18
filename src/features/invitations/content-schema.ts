import type { TemplateContentViewModel } from "@/features/templates/types";
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
    quote: getQuote(draft.quoteKey),
    eventDate: "Tanggal acara akan ditambahkan",
    eventDateIso: "2099-01-01T00:00:00+00:00",
    events: [],
    closing: templateCopy.closing,
    branding: "Undangan oleh Undango",
  };
}
