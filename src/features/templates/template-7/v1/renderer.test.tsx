import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateSevenV1 } from "@/features/templates/template-7/v1/definition";

describe("TemplateSevenRenderer", () => {
  afterEach(cleanup);

  it("renders demo content, event details, and a working maps link on initial render", () => {
    const Renderer = templateSevenV1.renderer;

    render(
      <Renderer
        content={templateSevenV1.demo.content}
        palette={templateSevenV1.palettes[0]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Alika & Bregas" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Minggu, 12 Oktober 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Akad Nikah")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Buka Google Maps" })[0]).toHaveAttribute(
      "href",
      "https://maps.google.com/?q=Kudus+Convention+Hall",
    );
    expect(screen.queryByRole("button", { name: "Buka undangan" })).not.toBeInTheDocument();
  }, 15_000);

  it("keeps three named palette choices", () => {
    expect(templateSevenV1.palettes.map((palette) => palette.key)).toEqual([
      "lumen",
      "kelam",
      "kertas",
    ]);
  });

  it("omits optional sections when their content is absent", () => {
    const Renderer = templateSevenV1.renderer;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to exclude from requiredContent
    const { gift, rsvp, wishes, gallery, ...requiredContent } = templateSevenV1.demo.content;

    render(<Renderer content={requiredContent} palette={templateSevenV1.palettes[0]} />);

    expect(screen.queryByRole("heading", { name: "Sampaikan kehadiran" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tanda kasih" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Kirimkan kata baik" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sepenggal momen kami" })).not.toBeInTheDocument();
  });
});
