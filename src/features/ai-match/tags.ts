import type { Kategori, Nuansa } from "./schema";

export const KATEGORI_KEYWORDS: Record<Kategori, readonly string[]> = {
  klasik: ["jawa", "klasik", "adat", "tradisional", "elegan", "formal", "kraton"],
  modern: ["modern", "pantai", "pesisir", "senja", "sunset", "minimalis", "outdoor"],
  botanical: ["botanical", "taman", "garden", "bunga", "alam", "kontemporer", "intim", "rustic"],
};

export const NUANSA_KEYWORDS: Record<Nuansa, readonly string[]> = {
  muted: ["pastel", "lembut", "cerah", "netral", "kalem"],
  warm: ["hangat", "sunset", "senja", "earthy", "keemasan", "terakota"],
  bold: ["gelap", "malam", "dramatis", "kontras", "hitam"],
};

export const PALETTE_INDEX_BY_NUANSA: Record<Nuansa, number> = {
  muted: 0,
  warm: 1,
  bold: 2,
};
