import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArchiveInvitationControl } from "./archive-invitation-control";

afterEach(cleanup);

describe("ArchiveInvitationControl", () => {
  it("requires explicit confirmation before submitting archive", () => {
    render(<ArchiveInvitationControl disabled={false} formAction={vi.fn()} isSubmitting={false} onConfirm={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Arsipkan" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Tindakan ini tidak dapat dibatalkan.");
    expect(screen.getByRole("button", { name: "Batalkan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ya, arsipkan invitation" })).toBeInTheDocument();
  });

  it("closes without archiving when cancelled", () => {
    render(<ArchiveInvitationControl disabled={false} formAction={vi.fn()} isSubmitting={false} onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Arsipkan" }));
    fireEvent.click(screen.getByRole("button", { name: "Batalkan" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
