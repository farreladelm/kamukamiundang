import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateThreeV1 } from "@/features/templates/template-3/v1/definition";

describe("TemplateThreeRenderer", () => {
  afterEach(cleanup);

  it("renders botanical demo content, event details, and responsive layout", () => {
    const Renderer = templateThreeV1.renderer;

    const { container } = render(
      <Renderer
        content={templateThreeV1.demo.content}
        palette={templateThreeV1.palettes[0]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Svara & Raka" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sabtu, 19 Desember 2026")).toBeInTheDocument();
    expect(screen.getByText("Pemberkatan")).toBeInTheDocument();
    expect(screen.getAllByText("Rumah Kaca Bumi Sangkuriang")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Petunjuk arah" })[0]).toHaveAttribute(
      "href",
      "https://maps.google.com/?q=Rumah+Kaca+Bumi+Sangkuriang",
    );
    expect(container.querySelector(".sm\\:grid-cols-2")).not.toBeNull();
  });

  it("keeps three named palette choices", () => {
    expect(templateThreeV1.palettes.map((palette) => palette.key)).toEqual([
      "lumut",
      "mawar",
      "arang",
    ]);
  });
});
