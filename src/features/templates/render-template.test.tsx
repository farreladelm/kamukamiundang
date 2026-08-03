import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderTemplate } from "@/features/templates/render-template";
import { getTemplateDefinition } from "@/features/templates/registry";

describe("renderTemplate", () => {
  afterEach(cleanup);

  it("renders pinned Template 1 demo content with core wedding sections", () => {
    const template = getTemplateDefinition("template-1", 1);

    if (!template) {
      throw new Error("Expected Template 1 v1 in registry");
    }

    render(renderTemplate(template, template.demo.paletteKey, template.demo.content));

    expect(
      screen.getByRole("heading", { name: "Aruna & Bima" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Akad Nikah")).toBeInTheDocument();
    expect(screen.getByText("Resepsi")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Buka Google Maps" })[0],
    ).toHaveAttribute("href", "https://maps.google.com/?q=Pendopo+Joglo+Sari");
  });

  it("rejects palette keys outside pinned template version", () => {
    const template = getTemplateDefinition("template-1", 1);

    if (!template) {
      throw new Error("Expected Template 1 v1 in registry");
    }

    expect(() =>
      renderTemplate(template, "tidak-ada", template.demo.content),
    ).toThrow("Unknown palette");
  });
});
