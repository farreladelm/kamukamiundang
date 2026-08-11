import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateSixV1 } from "@/features/templates/template-6/v1/definition";

describe("TemplateSixRenderer", () => {
  afterEach(cleanup);

  it("renders minimalist demo content and event details", () => {
    const Renderer = templateSixV1.renderer;

    render(
      <Renderer
        content={templateSixV1.demo.content}
        palette={templateSixV1.palettes[0]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(
      screen.getByRole("heading", { name: "Wulan & Arya" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Sabtu, 30 Januari 2027").length).toBeGreaterThan(0);
    expect(screen.getByText("Pemberkatan & Resepsi")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Buka peta" })[0]).toHaveAttribute(
      "href",
      "https://maps.google.com/?q=Rumah+Kayu+Bintaro",
    );
  }, 15_000);

  it("keeps three named palette choices", () => {
    expect(templateSixV1.palettes.map((palette) => palette.key)).toEqual([
      "kapas",
      "abu",
      "krem",
    ]);
  });

  it("does not enable rsvp-less capabilities that were intentionally dropped for a lean minimalist flow", () => {
    expect(templateSixV1.capabilities).not.toContain("music");
    expect(templateSixV1.capabilities).not.toContain("story");
  });
});
