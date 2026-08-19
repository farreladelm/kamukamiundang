import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioPlayer } from "./audio-player";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AudioPlayer", () => {
  it("waits for explicit user input before playback", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);

    render(<AudioPlayer src="/api/assets/audio-1" title="Lagu kami" />);

    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Putar Lagu kami" }));
    expect(play).toHaveBeenCalledOnce();
    fireEvent.click(await screen.findByRole("button", { name: "Jeda Lagu kami" }));
    expect(pause).toHaveBeenCalledOnce();
  });

  it("reports playback rejection without breaking the invitation", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("Blocked"));

    render(<AudioPlayer src="/api/assets/audio-1" title="Lagu kami" />);
    fireEvent.click(screen.getByRole("button", { name: "Putar Lagu kami" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Musik tidak dapat diputar.");
  });
});
