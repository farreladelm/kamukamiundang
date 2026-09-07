import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { templateSevenV1 } from "@/features/templates/template-7/v1/definition";

describe("TemplateSevenRenderer", () => {
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

  it("submits public RSVP through the invitation endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const Renderer = templateSevenV1.renderer;
    const content = {
      ...templateSevenV1.demo.content,
      rsvp: {
        ...templateSevenV1.demo.content.rsvp!,
        events: [{ key: "mainEvent" as const, label: "Akad Nikah", capacity: 10 }],
      },
    };

    render(<Renderer content={content} palette={templateSevenV1.palettes[0]} publicInvitationSlug="template-seven-test" />);
    const rsvpForm = screen.getByRole("button", { name: "Kirim RSVP" }).closest("form");
    if (!rsvpForm) throw new Error("RSVP form not found");
    const nameInput = rsvpForm.querySelector("input[name='name']");
    if (!nameInput) throw new Error("RSVP name input not found");
    fireEvent.change(nameInput, { target: { value: "Guest Seven" } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim RSVP" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/invitations/template-seven-test/rsvp");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      name: "Guest Seven",
      attendance: "ATTENDING",
      guestCount: 1,
      eventKeys: ["mainEvent"],
    });
    expect(screen.getByRole("status")).toHaveTextContent("konfirmasi Anda sudah tercatat");
  });

  it("submits public wishes through the invitation endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: () => "template-seven-wish-key" });
    const Renderer = templateSevenV1.renderer;
    const content = {
      ...templateSevenV1.demo.content,
      wishes: { prompt: "Tinggalkan doa.", entries: [] },
    };

    render(<Renderer content={content} palette={templateSevenV1.palettes[0]} publicInvitationSlug="template-seven-wishes" />);
    const wishForm = screen.getByRole("button", { name: "Kirim ucapan" }).closest("form");
    if (!wishForm) throw new Error("Wish form not found");
    const nameInput = wishForm.querySelector("input[name='name']");
    const messageInput = wishForm.querySelector("textarea[name='message']");
    if (!nameInput || !messageInput) throw new Error("Wish fields not found");
    fireEvent.change(nameInput, { target: { value: "Guest Seven" } });
    fireEvent.change(messageInput, { target: { value: "Semoga selalu rukun." } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim ucapan" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/invitations/template-seven-wishes/wishes");
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe("template-seven-wish-key");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ name: "Guest Seven", message: "Semoga selalu rukun.", honeypot: "" });
    expect(screen.getByText(/Semoga selalu rukun\./)).toBeInTheDocument();
  });

  it("rotates wish idempotency after a changed retry", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: "Koneksi gagal." }) })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("crypto", { randomUUID: vi.fn()
      .mockReturnValueOnce("template-seven-first-key")
      .mockReturnValueOnce("template-seven-second-key") });
    const Renderer = templateSevenV1.renderer;
    const content = {
      ...templateSevenV1.demo.content,
      wishes: { prompt: "Tinggalkan doa.", entries: [] },
    };

    render(<Renderer content={content} palette={templateSevenV1.palettes[0]} publicInvitationSlug="template-seven-retry" />);
    const wishForm = screen.getByRole("button", { name: "Kirim ucapan" }).closest("form");
    if (!wishForm) throw new Error("Wish form not found");
    const nameInput = wishForm.querySelector("input[name='name']");
    const messageInput = wishForm.querySelector("textarea[name='message']");
    if (!nameInput || !messageInput) throw new Error("Wish fields not found");
    fireEvent.change(nameInput, { target: { value: "Guest Seven" } });
    fireEvent.change(messageInput, { target: { value: "Semoga selalu rukun." } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim ucapan" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.change(messageInput, { target: { value: "Semoga selalu rukun dan bahagia." } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim ucapan" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(fetchMock.mock.calls[1][1].headers["Idempotency-Key"]).toBe("template-seven-second-key");
  });
});
