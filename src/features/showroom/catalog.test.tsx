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
});
