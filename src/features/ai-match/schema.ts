import { z } from "zod";

export const kategoriSchema = z.enum(["klasik", "modern", "botanical"]);
export const nuansaSchema = z.enum(["muted", "warm", "bold"]);

export const matchBriefSchema = z.object({
  kategori: kategoriSchema.nullable(),
  nuansa: nuansaSchema.nullable(),
});

export type Kategori = z.infer<typeof kategoriSchema>;
export type Nuansa = z.infer<typeof nuansaSchema>;
export type MatchBrief = z.infer<typeof matchBriefSchema>;
