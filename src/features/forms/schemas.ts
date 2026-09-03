import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const invitationSlugSchema = z
  .string()
  .trim()
  .min(3, "URL publik minimal 3 karakter.")
  .max(80, "URL publik maksimal 80 karakter.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Gunakan huruf kecil, angka, dan tanda hubung tunggal.");

const optionalInvitationSlugSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .pipe(invitationSlugSchema.optional())
  .optional();

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Masukkan alamat email yang valid."),
  password: z
    .string()
    .min(12, "Kata sandi minimal 12 karakter.")
    .max(128, "Kata sandi maksimal 128 karakter."),
});

export const orderIntakeSchema = z.object({
  customerId: optionalText,
  customerName: z.string().trim().min(1, "Nama customer wajib diisi."),
  whatsapp: optionalText.refine(
    (value) => value == null || value === "" || /^[+0-9\s()-]{8,20}$/.test(value ?? ""),
    "Masukkan nomor WhatsApp yang valid.",
  ),
  email: optionalText.refine(
    (value) => value == null || value === "" || z.email().safeParse(value ?? "").success,
    "Masukkan alamat email yang valid.",
  ),
  requestedInvitationSlug: optionalInvitationSlugSchema,
  templateSelection: z.string().trim().min(1, "Template dan palette wajib dipilih."),
  photoLimit: z.coerce.number().int("Batas foto harus berupa angka bulat.").nonnegative("Batas foto tidak boleh negatif."),
});

export const rsvpDemoSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi."),
  guests: z.coerce.number().int().positive("Jumlah tamu minimal 1."),
  attendance: z.enum(["yes", "no"], "Pilih status kehadiran."),
});

export const wishDemoSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi."),
  message: z
    .string()
    .trim()
    .min(1, "Ucapan wajib diisi.")
    .max(1000, "Ucapan maksimal 1000 karakter."),
});

export function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}
