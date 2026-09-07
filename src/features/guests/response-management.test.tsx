import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FormActionState } from "@/features/forms/action-state";
import { ResponseManagement, type ResponseManagementProps } from "./response-management";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

afterEach(() => {
  cleanup();
  refreshMock.mockClear();
});

function responseFixture(): ResponseManagementProps["data"] {
  return {
    invitation: {
      id: "00000000-0000-4000-8000-000000000001",
      customerName: "Customer",
      status: "PUBLISHED",
      editingEnabled: false,
      slug: "customer-invitation",
    },
    rsvps: { items: [], nextCursor: null },
    wishes: {
      nextCursor: null,
      items: [{
        id: "00000000-0000-4000-8000-000000000002",
        name: "Guest",
        message: "Semoga bahagia.",
        visibility: "VISIBLE",
        createdAt: "2026-09-07T10:00:00.000Z",
      }],
    },
  };
}

describe("ResponseManagement", () => {
  it("keeps delete form mounted so confirmation submit reaches server action", async () => {
    const action = vi.fn(async (_state: FormActionState, _formData: FormData) => {
      void _state;
      void _formData;
      return {
        status: "idle" as const,
        message: "",
        formErrors: [],
        fieldErrors: {},
      };
    });

    render(
      <ResponseManagement
        action={action}
        basePath="/workspace/invitations/00000000-0000-4000-8000-000000000001/responses"
        data={responseFixture()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya, hapus permanen" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const submittedFormData = action.mock.calls[0]?.[1] as FormData;
    expect(submittedFormData.get("wishId")).toBe("00000000-0000-4000-8000-000000000002");
    expect(submittedFormData.get("intent")).toBe("delete");
  });
});
