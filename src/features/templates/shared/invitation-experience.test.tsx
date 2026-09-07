import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { templateOneV1 } from "@/features/templates/template-1/v1/definition";
import { templateTwoV1 } from "@/features/templates/template-2/v1/definition";

describe("InvitationExperience", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

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

  it("submits public wishes with idempotency and shows the new wish", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "wish-client-key" });
    const Renderer = templateTwoV1.renderer;
    const content = {
      ...templateTwoV1.demo.content,
      wishes: { prompt: "Tinggalkan doa.", entries: [] },
    };

    render(<Renderer content={content} palette={templateTwoV1.palettes[0]} publicInvitationSlug="public-wishes" />);
    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));
    const wishSection = screen.getByRole("heading", { name: "Kirimkan kata baik" }).closest("section");
    if (!wishSection) throw new Error("Wish section not found");
    fireEvent.change(wishSection.querySelector("input[name='name']")!, { target: { value: "Guest" } });
    fireEvent.change(wishSection.querySelector("textarea[name='message']")!, { target: { value: "Semoga bahagia." } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim ucapan" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/invitations/public-wishes/wishes");
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe("wish-client-key");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: "Guest",
      message: "Semoga bahagia.",
      honeypot: "",
    });
    expect(screen.getByText(/Semoga bahagia\./)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Terima kasih atas ucapan Anda.");
  });

  it("renders stored wish content as text instead of markup", () => {
    const Renderer = templateTwoV1.renderer;
    const content = {
      ...templateTwoV1.demo.content,
      wishes: { ...templateTwoV1.demo.content.wishes!, entries: [{ id: "wish-1", name: "<em>Guest</em>", message: "<script>alert(1)</script>" }] },
    };

    const { container } = render(<Renderer content={content} palette={templateTwoV1.palettes[0]} />);
    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));

    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
  });

  it("disables public wish submission while pending and preserves safe server errors", async () => {
    let resolveFetch!: (value: unknown) => void;
    const fetchMock = vi.fn().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "pending-wish-key" });
    const Renderer = templateTwoV1.renderer;
    const content = { ...templateTwoV1.demo.content, wishes: { prompt: "Tinggalkan doa.", entries: [] } };

    render(<Renderer content={content} palette={templateTwoV1.palettes[0]} publicInvitationSlug="pending-wishes" />);
    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));
    const wishSection = screen.getByRole("heading", { name: "Kirimkan kata baik" }).closest("section");
    if (!wishSection) throw new Error("Wish section not found");
    fireEvent.change(wishSection.querySelector("input[name='name']")!, { target: { value: "Guest" } });
    fireEvent.change(wishSection.querySelector("textarea[name='message']")!, { target: { value: "Coba lagi." } });
    const submitButton = screen.getByRole("button", { name: "Kirim ucapan" });
    fireEvent.click(submitButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(submitButton).toBeDisabled();
    resolveFetch({ ok: false, json: async () => ({ message: "Ucapan tidak tersedia." }) });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Ucapan tidak tersedia."));
    expect(submitButton).not.toBeDisabled();
  });
});
