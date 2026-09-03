import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateFiveV1 } from "@/features/templates/template-5/v1/definition";

describe("TemplateFiveRenderer", () => {
  afterEach(cleanup);

  it("renders elegant demo content, event details, and responsive layout", () => {
    const Renderer = templateFiveV1.renderer;

    const { container } = render(
      <Renderer
        content={templateFiveV1.demo.content}
        palette={templateFiveV1.palettes[0]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(
      screen.getByRole("heading", { name: "Kirana & Adrian" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Sabtu, 21 November 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Resepsi")).toBeInTheDocument();
    expect(screen.getAllByText("The Grand Ballroom, Hotel Arunika")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Lihat lokasi" })[0]).toHaveAttribute(
      "href",
      "https://maps.google.com/?q=Hotel+Arunika+Jakarta",
    );
    expect(container.querySelector(".\\@sm\\:grid-cols-2")).not.toBeNull();
  }, 15_000);

  it("keeps three named palette choices", () => {
    expect(templateFiveV1.palettes.map((palette) => palette.key)).toEqual([
      "onyx",
      "marun",
      "navi",
    ]);
  });
});
