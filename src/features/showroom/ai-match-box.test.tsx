import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiMatchBox } from "@/features/showroom/ai-match-box";

describe("AiMatchBox", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("submits the story and reports the match result", async () => {
    const onMatched = vi.fn();
    const response = { source: "fallback", results: [] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    });

    render(<AiMatchBox onMatched={onMatched} />);

    fireEvent.change(screen.getByLabelText("Ceritakan pernikahanmu"), {
      target: { value: "Pernikahan adat Jawa yang hangat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cocokkan template" }));

    await waitFor(() => expect(onMatched).toHaveBeenCalledWith(response));
    expect(fetch).toHaveBeenCalledWith(
      "/api/ai-match",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ cerita: "Pernikahan adat Jawa yang hangat" }),
      }),
    );
  });

  it("shows an error and does not call onMatched when the request fails", async () => {
    const onMatched = vi.fn();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ pesan: "Gagal mencocokkan template." }),
    });

    render(<AiMatchBox onMatched={onMatched} />);

    fireEvent.change(screen.getByLabelText("Ceritakan pernikahanmu"), {
      target: { value: "Cerita apa saja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cocokkan template" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal mencocokkan template.");
    expect(onMatched).not.toHaveBeenCalled();
  });

  it("shows the generic fallback message when the error response body isn't JSON", async () => {
    const onMatched = vi.fn();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("not json")),
    });

    render(<AiMatchBox onMatched={onMatched} />);

    fireEvent.change(screen.getByLabelText("Ceritakan pernikahanmu"), {
      target: { value: "Cerita apa saja" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cocokkan template" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal mencocokkan template.");
    expect(onMatched).not.toHaveBeenCalled();
  });

  it("disables submit until the textarea has content", () => {
    render(<AiMatchBox onMatched={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cocokkan template" })).toBeDisabled();
  });
});
