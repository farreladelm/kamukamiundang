import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Catalog } from "@/features/showroom/catalog";
import { templateRegistry } from "@/features/templates/registry";

describe("Catalog", () => {
  afterEach(cleanup);

  it("filters templates by category and resets to complete collection", () => {
    render(<Catalog templates={templateRegistry} />);

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
        templates={templateRegistry.map((template, index) => ({
          ...template,
          isVisible: index === 0,
        }))}
      />,
    );

    expect(screen.getByText("Larasati")).toBeInTheDocument();
    expect(screen.queryByText("Pesisir Senja")).not.toBeInTheDocument();
  });

  it("offers preview and contact actions for each visible template", () => {
    render(<Catalog templates={templateRegistry} canonicalOrigin="https://undango.test" />);

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
