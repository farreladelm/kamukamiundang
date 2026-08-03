import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateTwoV1 } from "@/features/templates/template-2/v1/definition";

describe("TemplateTwoRenderer", () => {
  afterEach(cleanup);

  it("renders coastal demo content, event details, and responsive layout", () => {
    const Renderer = templateTwoV1.renderer;

    const { container } = render(
      <Renderer
        content={templateTwoV1.demo.content}
        palette={templateTwoV1.palettes[0]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nara & Dimas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Minggu, 6 Desember 2026")).toBeInTheDocument();
    expect(screen.getByText("Akad & Pemberkatan")).toBeInTheDocument();
    expect(screen.getAllByText("Ruang Ombak, Nusa Dua")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Lihat lokasi" })[0]).toHaveAttribute(
      "href",
      "https://maps.google.com/?q=Ruang+Ombak+Nusa+Dua",
    );
    expect(container.querySelector(".sm\\:grid-cols-2")).not.toBeNull();
  });

  it("keeps three named palette choices", () => {
    expect(templateTwoV1.palettes.map((palette) => palette.key)).toEqual([
      "terakota",
      "samudra",
      "tembaga",
    ]);
  });
});
