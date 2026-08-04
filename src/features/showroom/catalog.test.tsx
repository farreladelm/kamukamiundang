import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Catalog } from "@/features/showroom/catalog";
import { templateRegistry } from "@/features/templates/registry";
import type { TemplateCatalogItem } from "@/features/templates/types";

const catalogTemplates: TemplateCatalogItem[] = templateRegistry.map((template, index) => ({
  templateKey: template.templateKey,
  templateVersion: template.templateVersion,
  slug: ["larasati", "pesisir-senja", "taman-aksara"][index],
  name: ["Larasati", "Pesisir Senja", "Taman Aksara"][index],
  category: ["Klasik", "Modern", "Botanical"][index],
  description: "Deskripsi katalog",
  priceInRupiah: 650000 + index * 50000,
  marketingThumbnail: null,
  displayOrder: (index + 1) * 10,
  status: "VISIBLE",
  isVisible: true,
  contentSchemaVersion: template.contentSchemaVersion,
  previewStyle: template.previewStyle,
  capabilities: template.capabilities,
  palettes: template.palettes,
  demo: template.demo,
}));

describe("Catalog", () => {
  afterEach(cleanup);

  it("filters templates by category and resets to complete collection", () => {
    render(<Catalog templates={catalogTemplates} />);

    expect(screen.getByText("Larasati")).toBeInTheDocument();
    expect(screen.getByText("Pesisir Senja")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Modern" }));

    expect(screen.queryByText("Larasati")).not.toBeInTheDocument();
    expect(screen.getByText("Pesisir Senja")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tampilkan semua template" }));

    expect(screen.getByText("Larasati")).toBeInTheDocument();
    expect(screen.getByText("Pesisir Senja")).toBeInTheDocument();
  });

  it("does not render hidden template versions", () => {
    render(
      <Catalog
        templates={catalogTemplates.map((template, index) => ({
          ...template,
          isVisible: index === 0,
        }))}
      />,
    );

    expect(screen.getByText("Larasati")).toBeInTheDocument();
    expect(screen.queryByText("Pesisir Senja")).not.toBeInTheDocument();
  });

  it("offers preview and contact actions for each visible template", () => {
    render(<Catalog templates={catalogTemplates} canonicalOrigin="https://undango.test" />);

    expect(screen.getByRole("link", { name: "Lihat preview Larasati" })).toHaveAttribute(
      "href",
      "/templates/larasati",
    );
    expect(screen.getAllByRole("link", { name: "Pesan via WhatsApp" })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Pesan via WhatsApp" })[0]).toHaveAttribute(
      "href",
      expect.stringContaining("undango.test%2Ftemplates%2Flarasati"),
    );
  });
});
