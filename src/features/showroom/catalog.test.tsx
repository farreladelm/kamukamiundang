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

    expect(screen.getAllByRole("link", { name: "Preview" })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Preview" })[0]).toHaveAttribute(
      "href",
      "/templates/larasati",
    );
    expect(screen.getAllByRole("link", { name: "Pesan" })).toHaveLength(3);
    expect(screen.getAllByRole("link", { name: "Pesan" })[0]).toHaveAttribute(
      "href",
      expect.stringContaining("undango.test%2Ftemplates%2Flarasati"),
    );
  });

  it("promotes the top match to the front, badges it, and applies its recommended palette", () => {
    render(
      <Catalog
        templates={catalogTemplates}
        canonicalOrigin="https://undango.test"
        matchResults={[
          {
            templateKey: "template-3",
            templateVersion: 1,
            slug: "taman-aksara",
            score: 3,
            reasons: ['cocok dengan kategori "botanical"'],
            paletteKey: "mawar",
          },
          { templateKey: "template-1", templateVersion: 1, slug: "larasati", score: 0, reasons: [], paletteKey: "gading" },
          { templateKey: "template-2", templateVersion: 1, slug: "pesisir-senja", score: 0, reasons: [], paletteKey: "terakota" },
        ]}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings[0]).toBe("Taman Aksara");
    expect(screen.getByText("Cocok untukmu")).toBeInTheDocument();
    expect(screen.getByText('cocok dengan kategori "botanical"')).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Pesan" })[0]).toHaveAttribute(
      "href",
      expect.stringContaining("mawar"),
    );
  });

  it("still applies the category filter correctly after a match has been applied", () => {
    render(
      <Catalog
        templates={catalogTemplates}
        canonicalOrigin="https://undango.test"
        matchResults={[
          {
            templateKey: "template-3",
            templateVersion: 1,
            slug: "taman-aksara",
            score: 3,
            reasons: ['cocok dengan kategori "botanical"'],
            paletteKey: "mawar",
          },
          { templateKey: "template-1", templateVersion: 1, slug: "larasati", score: 0, reasons: [], paletteKey: "gading" },
          { templateKey: "template-2", templateVersion: 1, slug: "pesisir-senja", score: 0, reasons: [], paletteKey: "terakota" },
        ]}
      />,
    );

    // Sanity check pre-filter: the recommended template (Botanical) leads.
    expect(screen.getAllByRole("heading", { level: 3 })[0].textContent).toBe("Taman Aksara");

    // The recommended template is Botanical; filtering to Klasik should drop it,
    // just like any other filtered-out template, and only show Klasik templates.
    fireEvent.click(screen.getByRole("button", { name: "Klasik" }));

    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["Larasati"]);
    expect(screen.queryByText("Taman Aksara")).not.toBeInTheDocument();
    expect(screen.queryByText("Pesisir Senja")).not.toBeInTheDocument();
    expect(screen.queryByText("Cocok untukmu")).not.toBeInTheDocument();
  });

  it("does not badge any card when the top match score is zero", () => {
    render(
      <Catalog
        templates={catalogTemplates}
        canonicalOrigin="https://undango.test"
        matchResults={[
          { templateKey: "template-1", templateVersion: 1, slug: "larasati", score: 0, reasons: [], paletteKey: "gading" },
          { templateKey: "template-2", templateVersion: 1, slug: "pesisir-senja", score: 0, reasons: [], paletteKey: "terakota" },
          { templateKey: "template-3", templateVersion: 1, slug: "taman-aksara", score: 0, reasons: [], paletteKey: "lumut" },
        ]}
      />,
    );

    expect(screen.queryByText("Cocok untukmu")).not.toBeInTheDocument();
  });
});
