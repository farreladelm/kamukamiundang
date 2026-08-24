import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import { WorkspaceEditor } from "./workspace-editor";
import type { WorkspaceInvitationDto } from "@/features/invitations/workspace-dto";

afterEach(cleanup);

function workspaceFixture(templateKey = "template-1"): WorkspaceInvitationDto {
  const runtime = getTemplateRuntimeManifest(templateKey, 1);
  if (!runtime) throw new Error("Expected Template 1 v1");

  return {
    invitationId: "00000000-0000-0000-0000-000000000001",
    templateKey: runtime.templateKey,
    templateVersion: runtime.templateVersion,
    contentSchemaVersion: runtime.contentSchemaVersion,
    paletteKey: runtime.demo.paletteKey,
    contentVersion: 3,
    draft: {
      bride: { nickname: "Rani", fullName: "Rani Prameswari", fatherName: "Hadi", motherName: "Rani" },
      groom: { nickname: "Dimas", fullName: "Dimas Adinata", fatherName: "Surya", motherName: "Ratih" },
      quoteKey: "matthew-19-6",
      mainEvent: {
        label: "Akad Nikah",
        date: "2026-11-14",
        time: "08:00",
        timeZone: "Asia/Jakarta",
        venue: "Pendopo Joglo Sari",
        address: "Jl. Taman Sari No. 18, Yogyakarta",
        mapUrl: "https://maps.google.com/?q=Pendopo+Joglo+Sari",
      },
        secondaryEvent: null,
        story: null,
        gift: null,
    },
    palettes: runtime.palettes,
  };
}

describe("WorkspaceEditor", () => {
  it("renders typed fields and previews current local draft content", () => {
    render(<WorkspaceEditor workspace={workspaceFixture()} />);

    const [firstNameInput] = screen.getAllByRole("textbox", { name: "Nama panggilan" });
    expect(firstNameInput).toHaveValue("Rani");
    expect(screen.getAllByRole("textbox", { name: "Nama lengkap" })[0]).toHaveValue("Rani Prameswari");
    expect(screen.getAllByRole("textbox", { name: "Nama ayah" })[0]).toHaveValue("Hadi");
    expect(screen.getByRole("radio", { name: /Matthew 19:6/ })).toBeChecked();
    expect(screen.getByText("template-1 v1")).toBeInTheDocument();
    expect(screen.getAllByText(/Rani/).length).toBeGreaterThan(0);

    const mapsUrlInput = screen.getByRole("textbox", { name: "Tautan Google Maps" });
    fireEvent.change(mapsUrlInput, { target: { value: "https://example.com/maps" } });
    expect(screen.getByText("Gunakan tautan Google Maps HTTPS yang valid.")).toBeInTheDocument();
    expect(screen.getByTestId("invitation-experience")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-mobile-preview")).toHaveClass("max-w-[30rem]", "mx-auto");
    expect(screen.getByTestId("invitation-presentation")).toHaveClass("@container");
    expect(screen.getByTestId("invitation-desktop-panel").className).toContain("@[64rem]:flex");

    fireEvent.change(firstNameInput, { target: { value: "Naya" } });
    expect(firstNameInput).toHaveValue("Naya");
    expect(screen.getAllByText(/Naya/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("textbox", { name: "Pesan pembuka" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Pesan penutup" })).not.toBeInTheDocument();
  }, 15_000);

  it("supports gated story and gift sections with placeholder preview content", () => {
    render(<WorkspaceEditor workspace={workspaceFixture()} />);

    fireEvent.click(screen.getByRole("button", { name: "Tambah cerita" }));
    fireEvent.click(screen.getByRole("button", { name: "Tambah bab" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Judul bab" }), { target: { value: "Pertama bertemu" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Teks cerita" }), { target: { value: "Kami bertemu di kampus." } });
    expect(screen.getByText("Pertama bertemu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Buka undangan" }));
    expect(screen.getByRole("heading", { name: "Yang membawa kami ke sini" })).toBeInTheDocument();
    expect(screen.getByTestId("invitation-experience")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tambah informasi hadiah" }));
    fireEvent.click(screen.getByRole("button", { name: "Tambah rekening" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Bank" }), { target: { value: "Bank Nusantara" } });
    expect(screen.getByDisplayValue("Bank Nusantara")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tanda kasih" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hapus cerita" }));
    expect(screen.queryByRole("textbox", { name: "Judul bab" })).not.toBeInTheDocument();
  }, 15_000);

  it("does not enable optional controls for unsupported template capabilities", () => {
    render(<WorkspaceEditor workspace={workspaceFixture("template-2")} />);

    expect(screen.queryByRole("button", { name: "Tambah cerita" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tambah informasi hadiah" })).toBeInTheDocument();
  });
});
