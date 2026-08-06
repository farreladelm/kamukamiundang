import { describe, expect, it } from "vitest";
import { parseFallback } from "./rule-fallback";

describe("parseFallback", () => {
  it("detects kategori klasik and nuansa warm from Javanese wedding text", () => {
    expect(parseFallback("Pernikahan adat Jawa yang hangat di Yogyakarta")).toEqual({
      kategori: "klasik",
      nuansa: "warm",
    });
  });

  it("detects kategori modern and nuansa warm from beach/sunset keywords", () => {
    expect(parseFallback("Resepsi outdoor di pinggir pantai saat senja")).toEqual({
      kategori: "modern",
      nuansa: "warm",
    });
  });

  it("detects kategori botanical and nuansa bold from garden/dark text", () => {
    expect(parseFallback("Pesta taman yang gelap dan dramatis di malam hari")).toEqual({
      kategori: "botanical",
      nuansa: "bold",
    });
  });

  it("returns nulls when no keyword matches", () => {
    expect(parseFallback("Kami menikah bulan depan")).toEqual({
      kategori: null,
      nuansa: null,
    });
  });

  it("is case-insensitive", () => {
    expect(parseFallback("PERNIKAHAN ADAT JAWA")).toEqual({
      kategori: "klasik",
      nuansa: null,
    });
  });
});
