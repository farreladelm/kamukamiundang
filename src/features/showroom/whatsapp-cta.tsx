"use client";

import type { TemplatePalette } from "@/features/templates/types";
import { buildWhatsAppHref } from "./whatsapp";

type WhatsAppCtaProps = {
  whatsappNumber: string;
  canonicalUrl: string;
  template: {
    templateKey: string;
    templateVersion: number;
    name: string;
    priceInRupiah: number;
  };
  palette: Pick<TemplatePalette, "key" | "name">;
  className?: string;
};

function recordWhatsAppCtaClick({
  template,
  palette,
}: Pick<WhatsAppCtaProps, "template" | "palette">): void {
  try {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        name: "whatsapp_cta_clicked",
        properties: {
          templateKey: template.templateKey,
          templateVersion: template.templateVersion,
          paletteKey: palette.key,
        },
      }),
    }).catch(() => undefined);
  } catch {
    // Native navigation must continue when browser analytics setup fails.
  }
}

export function WhatsAppCta({
  whatsappNumber,
  canonicalUrl,
  template,
  palette,
  className,
}: WhatsAppCtaProps) {
  const href = buildWhatsAppHref(whatsappNumber, {
    templateKey: template.templateKey,
    templateVersion: template.templateVersion,
    templateName: template.name,
    paletteKey: palette.key,
    paletteName: palette.name,
    priceInRupiah: template.priceInRupiah,
    canonicalUrl,
  });

  return (
    <a className={className} href={href} onClick={() => recordWhatsAppCtaClick({ template, palette })}>
      Pesan via WhatsApp
    </a>
  );
}
