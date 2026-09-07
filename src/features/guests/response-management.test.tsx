import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormActionState } from "@/features/forms/action-state";
import type { ResponseManagementData } from "@/features/guests/response-data";
import { ResponseManagement } from "@/features/guests/response-management";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

afterEach(cleanup);
beforeEach(() => {
  refreshMock.mockClear();
});

const mockData: ResponseManagementData = {
  invitation: {
    id: "00000000-0000-4000-8000-000000000001",
    customerName: "Budi & Ani",
    status: "PUBLISHED",
    editingEnabled: true,
    slug: "budi-ani",
  },
  rsvps: {
    items: [
      {
        id: "rsvp-1",
        name: "Ahmad Dahlan",
        attendance: "ATTENDING",
        guestCount: 2,
        eventKeys: ["mainEvent", "secondaryEvent"],
        createdAt: "2026-09-01T10:00:00.000Z",
      },
      {
        id: "rsvp-2",
        name: "Siti Rahma",
        attendance: "NOT_ATTENDING",
        guestCount: 0,
        eventKeys: [],
        createdAt: "2026-09-01T11:00:00.000Z",
      },
      {
        id: "rsvp-3",
        name: "Bambang",
        attendance: "UNDECIDED",
        guestCount: 1,
        eventKeys: ["otherEvent"],
        createdAt: "2026-09-01T12:00:00.000Z",
      },
    ],
    nextCursor: "next-rsvp-cursor",
  },
  wishes: {
    items: [
      {
        id: "wish-1",
        name: "Eko Prasetyo",
        message: "Selamat berbahagia ya\nSemoga sakinah mawaddah warahmah.",
        visibility: "VISIBLE",
        createdAt: "2026-09-01T10:30:00.000Z",
      },
      {
        id: "wish-2",
        name: "Dewi Sartika",
        message: "Selamat menempuh hidup baru!",
        visibility: "HIDDEN",
        createdAt: "2026-09-01T11:30:00.000Z",
      },
    ],
    nextCursor: "next-wish-cursor",
  },
};

describe("ResponseManagement component", () => {
  it("1. Renders localized attendance labels", () => {
    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    expect(screen.getByText("Hadir")).toBeInTheDocument();
    expect(screen.getByText("Tidak hadir")).toBeInTheDocument();
    expect(screen.getByText("Belum memutuskan")).toBeInTheDocument();
  });

  it("2. Renders event labels and formatted WIB timestamp", () => {
    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    expect(screen.getByText("Acara utama")).toBeInTheDocument();
    expect(screen.getByText("Acara kedua")).toBeInTheDocument();
    expect(screen.getByText("otherEvent")).toBeInTheDocument();

    // WIB timestamp check
    const elementsWithWib = screen.getAllByText(/WIB/);
    expect(elementsWithWib.length).toBeGreaterThan(0);
  });

  it("3. Renders 'Belum ada RSVP.' when RSVP page is empty", () => {
    const emptyData: ResponseManagementData = {
      ...mockData,
      rsvps: { items: [], nextCursor: null },
    };

    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        data={emptyData}
      />,
    );

    expect(screen.getByText("Belum ada RSVP.")).toBeInTheDocument();
  });

  it("4. Renders 'Belum ada ucapan.' when wish page is empty", () => {
    const emptyData: ResponseManagementData = {
      ...mockData,
      wishes: { items: [], nextCursor: null },
    };

    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        data={emptyData}
      />,
    );

    expect(screen.getByText("Belum ada ucapan.")).toBeInTheDocument();
  });

  it("5. Visible wish renders 'Sembunyikan'", () => {
    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    expect(screen.getByRole("button", { name: "Sembunyikan" })).toBeInTheDocument();
  });

  it("6. Hidden wish renders 'Tampilkan kembali'", () => {
    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    expect(screen.getByRole("button", { name: "Tampilkan kembali" })).toBeInTheDocument();
  });

  it("7. First delete click opens confirmation and does not invoke action", () => {
    const actionMock = vi.fn();
    render(
      <ResponseManagement
        action={actionMock}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Hapus" });
    fireEvent.click(deleteButtons[0]!);

    expect(screen.getByText("Hapus ucapan ini?")).toBeInTheDocument();
    expect(
      screen.getByText("Ucapan akan dihapus permanen dan tidak dapat dipulihkan."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ya, hapus permanen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Batal" })).toBeInTheDocument();
    expect(actionMock).not.toHaveBeenCalled();
  });

  it("8. Cancel closes confirmation and does not invoke action", () => {
    const actionMock = vi.fn();
    render(
      <ResponseManagement
        action={actionMock}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Hapus" });
    fireEvent.click(deleteButtons[0]!);

    const cancelButton = screen.getByRole("button", { name: "Batal" });
    fireEvent.click(cancelButton);

    expect(screen.queryByText("Hapus ucapan ini?")).not.toBeInTheDocument();
    expect(actionMock).not.toHaveBeenCalled();
  });

  it("9. Confirmation submit sends delete intent", async () => {
    let capturedFormData!: FormData;
    const actionMock = vi.fn(async (_state: FormActionState, formData: FormData) => {
      capturedFormData = formData;
      return {
        status: "success" as const,
        message: "Ucapan dihapus permanen.",
        formErrors: [],
        fieldErrors: {},
      };
    });

    render(
      <ResponseManagement
        action={actionMock}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Hapus" });
    fireEvent.click(deleteButtons[0]!);

    const confirmButton = screen.getByRole("button", { name: "Ya, hapus permanen" });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(actionMock).toHaveBeenCalled());
    expect(capturedFormData.get("wishId")).toBe("wish-1");
    expect(capturedFormData.get("intent")).toBe("delete");
  });

  it("10. Pending mutation disables all moderation controls", async () => {
    let resolveAction!: (value: FormActionState) => void;
    const actionMock = vi.fn(
      () =>
        new Promise<FormActionState>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <ResponseManagement
        action={actionMock}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    const hideButton = screen.getByRole("button", { name: "Sembunyikan" });
    fireEvent.click(hideButton);

    await waitFor(() => expect(hideButton).toBeDisabled());
    expect(hideButton).toHaveTextContent("Menyembunyikan...");

    // Every other button should also be disabled
    const allButtons = screen.getAllByRole("button");
    for (const btn of allButtons) {
      expect(btn).toBeDisabled();
    }

    resolveAction({
      status: "success",
      message: "Ucapan disembunyikan.",
      formErrors: [],
      fieldErrors: {},
    });

    await waitFor(() => expect(hideButton).not.toBeDisabled());
  });

  it("11. Returned error renders with role='alert'", async () => {
    const actionMock = vi.fn(async () => ({
      status: "error" as const,
      message: "Ucapan sudah berubah atau tidak tersedia. Muat ulang halaman.",
      formErrors: ["Ucapan sudah berubah atau tidak tersedia. Muat ulang halaman."],
      fieldErrors: {},
    }));

    render(
      <ResponseManagement
        action={actionMock}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    const hideButton = screen.getByRole("button", { name: "Sembunyikan" });
    fireEvent.click(hideButton);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Ucapan sudah berubah atau tidak tersedia. Muat ulang halaman.",
    );
  });

  it("12. Returned success renders with role='status'", async () => {
    const actionMock = vi.fn(async () => ({
      status: "success" as const,
      message: "Ucapan disembunyikan.",
      formErrors: [],
      fieldErrors: {},
    }));

    render(
      <ResponseManagement
        action={actionMock}
        basePath="/workspace/invitations/123/responses"
        data={mockData}
      />,
    );

    const hideButton = screen.getByRole("button", { name: "Sembunyikan" });
    fireEvent.click(hideButton);

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Ucapan disembunyikan.");
  });

  it("13. RSVP next-page link preserves current wish cursor", () => {
    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        currentWishCursor="active-wish-cursor"
        data={mockData}
      />,
    );

    const links = screen.getAllByRole("link", { name: "Respons lebih lama" });
    // First link is for RSVP
    const rsvpNextLink = links[0];
    expect(rsvpNextLink).toHaveAttribute(
      "href",
      "/workspace/invitations/123/responses?rsvpCursor=next-rsvp-cursor&wishCursor=active-wish-cursor",
    );
  });

  it("14. Wish next-page link preserves current RSVP cursor", () => {
    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        currentRsvpCursor="active-rsvp-cursor"
        data={mockData}
      />,
    );

    const links = screen.getAllByRole("link", { name: "Respons lebih lama" });
    // Second link is for Wish
    const wishNextLink = links[1];
    expect(wishNextLink).toHaveAttribute(
      "href",
      "/workspace/invitations/123/responses?rsvpCursor=active-rsvp-cursor&wishCursor=next-wish-cursor",
    );
  });

  it("15. Kembali ke terbaru removes only the selected section cursor", () => {
    render(
      <ResponseManagement
        action={vi.fn()}
        basePath="/workspace/invitations/123/responses"
        currentRsvpCursor="active-rsvp-cursor"
        currentWishCursor="active-wish-cursor"
        data={mockData}
      />,
    );

    const resetLinks = screen.getAllByRole("link", { name: "Kembali ke terbaru" });
    expect(resetLinks).toHaveLength(2);

    // RSVP reset link removes rsvpCursor but preserves wishCursor
    expect(resetLinks[0]).toHaveAttribute(
      "href",
      "/workspace/invitations/123/responses?wishCursor=active-wish-cursor",
    );

    // Wish reset link removes wishCursor but preserves rsvpCursor
    expect(resetLinks[1]).toHaveAttribute(
      "href",
      "/workspace/invitations/123/responses?rsvpCursor=active-rsvp-cursor",
    );
  });
});
