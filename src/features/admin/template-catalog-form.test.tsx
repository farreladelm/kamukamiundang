import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialFormActionState } from "@/features/forms/action-state";

const { actionMock, actionState, pendingState, refreshMock, showToastMock } = vi.hoisted(() => ({
  actionMock: vi.fn(),
  actionState: { current: { status: "idle" as const, message: "", formErrors: [], fieldErrors: {} } as import("@/features/forms/action-state").FormActionState },
  pendingState: { current: false },
  refreshMock: vi.fn(),
  showToastMock: vi.fn(),
}));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState: () => [actionState.current, actionMock, pendingState.current],
}));

vi.mock("@/app/admin/templates/actions", () => ({
  updateTemplateCatalogAction: actionMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock("@/features/admin/admin-toast", () => ({
  useAdminToast: () => ({ showToast: showToastMock }),
}));

import { TemplateCatalogFormList } from "./template-catalog-form";

const inactiveCategory = {
  id: "11111111-1111-4111-8111-111111111199",
  key: "historical",
  name: "Historical",
};

const data = {
  catalogs: [{
    id: "21111111-1111-4111-8111-111111111111",
    templateKey: "template-1",
    templateVersion: 1,
    slug: "larasati",
    name: "Larasati",
    categoryId: inactiveCategory.id,
    category: { ...inactiveCategory, displayOrder: 90, isActive: false },
    description: "Deskripsi",
    priceInRupiah: 650000,
    marketingThumbnail: null,
    displayOrder: 10,
    updatedAt: "2026-08-05T10:00:00.000Z",
    status: "RETIRED" as const,
    runtime: {
      contentSchemaVersion: 1,
      previewStyle: "arch" as const,
      renderer: "RendererOne",
      capabilities: ["gallery", "rsvp"],
      palettes: [{ key: "ivory", name: "Ivory" }],
      demo: { paletteKey: "ivory", content: { title: "Demo" } },
    },
  }],
  categories: [{ id: "11111111-1111-4111-8111-111111111111", key: "klasik", name: "Klasik" }],
};
const formData = data as unknown as Parameters<typeof TemplateCatalogFormList>[0]["data"];
function formDataAtRevision(status: "DRAFT" | "VISIBLE", updatedAt: string) {
  return {
    ...data,
    catalogs: [{ ...data.catalogs[0], status, updatedAt }],
  } as unknown as Parameters<typeof TemplateCatalogFormList>[0]["data"];
}

beforeEach(() => {
  actionState.current = initialFormActionState;
  pendingState.current = false;
  actionMock.mockClear();
  refreshMock.mockClear();
  showToastMock.mockClear();
});
afterEach(cleanup);

describe("TemplateCatalogFormList", () => {
  it("renders runtime contract as read-only text without editable runtime inputs", () => {
    const { container } = render(<TemplateCatalogFormList data={formData} />);

    expect(screen.getByText("template-1")).toBeInTheDocument();
    expect(screen.getByText("RendererOne")).toBeInTheDocument();
    expect(screen.getByText("gallery, rsvp")).toBeInTheDocument();
    expect(screen.getByText("ivory (Ivory)")).toBeInTheDocument();
    expect(container.querySelector("input[name=templateKey]")).toBeNull();
    expect(container.querySelector("input[name=templateVersion]")).toBeNull();
    expect(container.querySelector("input[name=contentSchemaVersion]")).toBeNull();
    expect(container.querySelector("input[name=renderer]")).toBeNull();
    expect(container.querySelector("input[name=capabilities]")).toBeNull();
    expect(container.querySelector("input[name=palettes]")).toBeNull();
    expect(container.querySelector("input[name=demo]")).toBeNull();
    expect(container.querySelector("input[name=previewStyle]")).toBeNull();
  });

  it("associates inline field errors with invalid fields", async () => {
    actionState.current = {
      status: "error",
      message: "Periksa kembali data katalog.",
      formErrors: ["Periksa kembali data katalog."],
      fieldErrors: { name: ["Nama wajib diisi."] },
    };
    render(<TemplateCatalogFormList data={formData} />);

    expect(screen.getByText("Nama wajib diisi.")).toBeInTheDocument();
    const nameInput = screen.getByLabelText("Nama");
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(nameInput).toHaveAttribute("aria-describedby", `${data.catalogs[0].id}-name-error`);
  });

  it("disables RETIRED status while submitting RETIRED and preserves inactive current category", () => {
    const { container } = render(<TemplateCatalogFormList data={formData} />);
    const status = screen.getByLabelText("Status lifecycle");
    const category = screen.getByLabelText("Kategori");
    const form = container.querySelector("form")!;

    expect(status).toBeDisabled();
    expect(new FormData(form).get("status")).toBe("RETIRED");
    expect(category).toHaveValue(inactiveCategory.id);
    expect(screen.getAllByRole("option", { name: "Historical (nonaktif, historis)" })).toHaveLength(1);
  });

  it("refreshes uncontrolled lifecycle fields when server revision changes", () => {
    const draftData = formDataAtRevision("DRAFT", "2026-08-05T10:00:00.000Z");
    const visibleData = formDataAtRevision("VISIBLE", "2026-08-05T10:01:00.000Z");
    const { rerender } = render(<TemplateCatalogFormList data={draftData} />);

    expect(screen.getByLabelText("Status lifecycle")).toHaveValue("DRAFT");
    rerender(<TemplateCatalogFormList data={visibleData} />);

    expect(screen.getByLabelText("Status lifecycle")).toHaveValue("VISIBLE");
  });

  it("disables submit button and shows pending label while saving", () => {
    pendingState.current = true;
    render(<TemplateCatalogFormList data={formData} />);

    expect(screen.getByRole("button", { name: "Menyimpan..." })).toBeDisabled();
  });

  it("shows success toast and refreshes after successful save", async () => {
    actionState.current = {
      status: "success",
      message: "Metadata template berhasil diperbarui.",
      formErrors: [],
      fieldErrors: {},
    };
    render(<TemplateCatalogFormList data={formData} />);

    await waitFor(() => expect(showToastMock).toHaveBeenCalledWith("Metadata template berhasil diperbarui."));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("shows error toast without refreshing after failed save", async () => {
    actionState.current = {
      status: "error",
      message: "Metadata template tidak dapat diperbarui.",
      formErrors: ["Metadata template tidak dapat diperbarui."],
      fieldErrors: {},
    };
    render(<TemplateCatalogFormList data={formData} />);

    await waitFor(() => expect(showToastMock).toHaveBeenCalledWith("Metadata template tidak dapat diperbarui.", "error"));
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
