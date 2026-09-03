import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { templateOneV1 } from "@/features/templates/template-1/v1/definition";
import { templateTwoV1 } from "@/features/templates/template-2/v1/definition";

describe("InvitationExperience", () => {
  afterEach(cleanup);

  it("locks invitation content behind cover until guest opens it", () => {
    const Renderer = templateTwoV1.renderer;
    render(<Renderer content={templateTwoV1.demo.content} palette={templateTwoV1.palettes[0]} />);

    expect(screen.getByTestId("invitation-cover")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-content")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Buka undangan" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(screen.queryByTestId("invitation-cover")).not.toBeInTheDocument();
    expect(screen.getByTestId("invitation-content")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByRole("heading", { name: "Sampaikan kehadiran" })).toBeInTheDocument();
  }, 15_000);

  it("locks desktop invitation rail until cover is opened", () => {
    const Renderer = templateTwoV1.renderer;
    render(<Renderer content={templateTwoV1.demo.content} palette={templateTwoV1.palettes[0]} />);

    const rail = screen.getByTestId("invitation-scroll");
    expect(rail).toHaveStyle({ overflowY: "hidden" });

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(rail.style.overflowY).toBe("");
  });

  it("omits story when template content does not provide it", () => {
    const Renderer = templateTwoV1.renderer;
    render(
      <Renderer
        content={{ ...templateTwoV1.demo.content, story: undefined }}
        palette={templateTwoV1.palettes[0]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(screen.queryByRole("heading", { name: "Yang membawa kami ke sini" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sampaikan kehadiran" })).toBeInTheDocument();
  });

  it("renders classic content without RSVP when RSVP data is absent", () => {
    const Renderer = templateOneV1.renderer;
    render(<Renderer content={templateOneV1.demo.content} palette={templateOneV1.palettes[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(screen.queryByRole("heading", { name: "Sampaikan kehadiran" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tanda kasih" })).toBeInTheDocument();
  });

  it("shows RSVP field errors before accepting an incomplete submission", () => {
    const Renderer = templateTwoV1.renderer;
    render(<Renderer content={templateTwoV1.demo.content} palette={templateTwoV1.palettes[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));
    const rsvpSection = screen.getByRole("heading", { name: "Sampaikan kehadiran" }).closest("section");
    const form = rsvpSection?.querySelector("form");
    if (!form) throw new Error("RSVP form not found");

    fireEvent.submit(form);

    expect(screen.getByText("Nama wajib diisi.")).toBeInTheDocument();
  });
});
