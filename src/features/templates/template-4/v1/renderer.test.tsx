import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateFourV1 } from "@/features/templates/template-4/v1/definition";

describe("TemplateFourRenderer", () => {
  afterEach(cleanup);

  it("renders islami demo content, event details, and responsive layout", () => {
    const Renderer = templateFourV1.renderer;

    const { container } = render(
      <Renderer
        content={templateFourV1.demo.content}
        palette={templateFourV1.palettes[0]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(
      screen.getByRole("heading", { name: "Salma & Rafi" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Minggu, 18 Oktober 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Akad Nikah")).toBeInTheDocument();
    expect(screen.getAllByText("Masjid Agung Al-Ikhlas")).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Buka Google Maps" })[0]).toHaveAttribute(
      "href",
      "https://maps.google.com/?q=Masjid+Agung+Al-Ikhlas+Sleman",
    );
    expect(container.querySelector(".\\@sm\\:grid-cols-2")).not.toBeNull();
  }, 15_000);

  it("keeps three named palette choices", () => {
    expect(templateFourV1.palettes.map((palette) => palette.key)).toEqual([
      "zamrud",
      "nur",
      "malam-suci",
    ]);
  });
});
