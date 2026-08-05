import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsAppCta } from "./whatsapp-cta";

describe("WhatsAppCta", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts analytics without delaying its WhatsApp link", () => {
    const fetch = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal("fetch", fetch);

    render(
      <WhatsAppCta
        whatsappNumber="62811222333"
        canonicalUrl="https://undango.example/templates/larasati"
        template={{
          templateKey: "template-1",
          templateVersion: 1,
          name: "Larasati",
          priceInRupiah: 650000,
        }}
        palette={{ key: "gading", name: "Gading" }}
      />,
    );

    const link = screen.getByRole("link", { name: "Pesan" });
    const preventNavigation = (event: MouseEvent) => event.preventDefault();
    link.addEventListener("click", preventNavigation);

    fireEvent.click(link);
    link.removeEventListener("click", preventNavigation);
    expect(fetch).toHaveBeenCalledWith(
      "/api/analytics/events",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        body: JSON.stringify({
          name: "whatsapp_cta_clicked",
          properties: {
            templateKey: "template-1",
            templateVersion: 1,
            paletteKey: "gading",
          },
        }),
      }),
    );
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/62811222333?text="),
    );
  });
});
