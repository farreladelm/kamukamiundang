import { describe, expect, it } from "vitest";
import { buildWhatsAppHref } from "./whatsapp";

describe("buildWhatsAppHref", () => {
  it("carries exact template identity, current price, palette, and canonical URL", () => {
    const href = buildWhatsAppHref("+62 811-222-333", {
      templateKey: "template-1",
      templateVersion: 1,
      templateName: "Larasati",
      paletteKey: "gading",
      paletteName: "Gading",
      priceInRupiah: 650000,
      canonicalUrl: "https://undango.example/templates/larasati",
    });

    const url = new URL(href);

    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/62811222333");
    expect(url.searchParams.get("text")).toBe(
      "Saya ingin memesan Larasati (template-1 v1) dengan palette Gading (gading) seharga Rp650.000. https://undango.example/templates/larasati",
    );
  });

  it("rejects an invalid WhatsApp recipient", () => {
    expect(() =>
      buildWhatsAppHref("not a number", {
        templateKey: "template-1",
        templateVersion: 1,
        templateName: "Larasati",
        paletteKey: "gading",
        paletteName: "Gading",
        priceInRupiah: 650000,
        canonicalUrl: "https://undango.example/templates/larasati",
      }),
    ).toThrow("WhatsApp number must contain digits");
  });
});
