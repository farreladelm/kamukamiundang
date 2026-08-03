export type WhatsAppOrderContext = {
  templateKey: string;
  templateVersion: number;
  templateName: string;
  paletteKey: string;
  paletteName: string;
  priceInRupiah: number;
  canonicalUrl: string;
};

function formatRupiah(priceInRupiah: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(priceInRupiah)
    .replace(/\u00a0/g, "");
}

export function buildWhatsAppHref(
  whatsappNumber: string,
  context: WhatsAppOrderContext,
): string {
  const recipient = whatsappNumber.replace(/\D/g, "");

  if (!recipient) {
    throw new Error("WhatsApp number must contain digits");
  }

  const message = `Saya ingin memesan ${context.templateName} (${context.templateKey} v${context.templateVersion}) dengan palette ${context.paletteName} (${context.paletteKey}) seharga ${formatRupiah(context.priceInRupiah)}. ${context.canonicalUrl}`;
  const url = new URL(`https://wa.me/${recipient}`);
  url.searchParams.set("text", message);

  return url.toString();
}
