import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InvitationPublicationControls } from "./publication-controls";

afterEach(cleanup);

describe("InvitationPublicationControls", () => {
  it("shows a returned publication failure inline", async () => {
    async function failedAction() {
      return { error: "Perubahan publikasi tidak dapat disimpan." };
    }

    render(
      <InvitationPublicationControls
        action={failedAction}
        editingEnabled
        status="DRAFT"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Perubahan publikasi tidak dapat disimpan.");
  });

  it("disables every lifecycle mutation while one is pending", async () => {
    let resolveAction!: (state: { error?: string }) => void;
    const action = vi.fn(() => new Promise<{ error?: string }>((resolve) => {
      resolveAction = resolve;
    }));

    render(<InvitationPublicationControls action={action} editingEnabled status="PUBLISHED" />);
    const publishButton = screen.getByRole("button", { name: "Publish ulang" });
    const unpublishButton = screen.getByRole("button", { name: "Batalkan publikasi" });
    const editingButton = screen.getByRole("button", { name: "Kunci editing" });
    const archiveButton = screen.getByRole("button", { name: "Arsipkan" });
    fireEvent.click(publishButton);

    await waitFor(() => expect(publishButton).toBeDisabled());
    expect(publishButton).toHaveTextContent("Mempublikasikan...");
    expect(unpublishButton).toBeDisabled();
    expect(unpublishButton).toHaveTextContent("Batalkan publikasi");
    expect(editingButton).toBeDisabled();
    expect(editingButton).toHaveTextContent("Kunci editing");
    expect(archiveButton).toBeDisabled();

    resolveAction({});
    await waitFor(() => expect(publishButton).not.toBeDisabled());
  });
});
