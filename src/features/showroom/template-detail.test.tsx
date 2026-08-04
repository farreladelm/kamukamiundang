import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TemplateDetail } from "@/features/showroom/template-detail";
import { templateRegistry } from "@/features/templates/registry";
import type { TemplateCatalogItem } from "@/features/templates/types";

const template = templateRegistry[0];
const catalogTemplate: TemplateCatalogItem = {
  templateKey: template.templateKey,
  templateVersion: template.templateVersion,
  slug: "larasati",
  name: "Larasati",
  category: "Klasik",
  description: "Klasik Jawa",
  priceInRupiah: 650000,
  marketingThumbnail: null,
  displayOrder: 10,
  status: "VISIBLE",
  isVisible: true,
  contentSchemaVersion: template.contentSchemaVersion,
  previewStyle: template.previewStyle,
  capabilities: template.capabilities,
  palettes: template.palettes,
  demo: template.demo,
};

describe("TemplateDetail", () => {
  afterEach(cleanup);

  it("renders pinned demo and applies only selected compatible palette colors", () => {
    render(
      <TemplateDetail template={catalogTemplate} />,
    );

    const demo = screen.getByTestId("template-demo");
    const renderedTemplate = demo.firstElementChild;

    expect(screen.getByRole("heading", { name: "Larasati" })).toBeInTheDocument();
    expect(screen.getByText("Aruna")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Buka pilihan palet" }));
    expect(screen.getByRole("button", { name: /^Gading/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("button", { name: "Terakota" })).not.toBeInTheDocument();
    expect(renderedTemplate).toHaveStyle({ backgroundColor: "rgb(246, 240, 229)" });

    fireEvent.click(screen.getByRole("button", { name: "Soga" }));

    expect(screen.getByRole("button", { name: "Buka pilihan palet" })).toHaveTextContent("Soga");
    fireEvent.click(screen.getByRole("button", { name: "Buka pilihan palet" }));
    expect(screen.getByRole("button", { name: /^Soga/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(demo.firstElementChild).toBe(renderedTemplate);
    expect(renderedTemplate).toHaveStyle({ backgroundColor: "rgb(240, 231, 217)" });
    expect(screen.queryByRole("link", { name: "Pesan via WhatsApp" })).not.toBeInTheDocument();
  }, 15_000);

  it("renders as a mobile invitation with desktop cover and fixed palette control", () => {
    render(
      <TemplateDetail template={catalogTemplate} />,
    );

    expect(screen.getByTestId("preview-cover")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Kembali ke koleksi" })).not.toBeInTheDocument();
    expect(screen.getByTestId("preview-cover").className).toContain("lg:h-screen");
    expect(screen.getByTestId("preview-cover").className).toContain("lg:sticky");
    expect(screen.getByTestId("preview-cover").className).toContain("hidden");
    expect(screen.getByTestId("invitation-frame")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-scroll")).toHaveStyle({
      backgroundColor: "rgb(246, 240, 229)",
    });
    expect(screen.getByTestId("invitation-scroll").className).not.toContain("px-3");
    expect(screen.getByTestId("invitation-scroll").className).not.toContain("py-5");
    expect(screen.getByRole("button", { name: "Buka pilihan palet" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("dialog", { name: "Pilihan palet" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Buka pilihan palet" }));

    expect(screen.getByRole("dialog", { name: "Pilihan palet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Soga" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
