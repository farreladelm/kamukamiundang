import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import { WorkspaceEditor } from "./workspace-editor";
import type { WorkspaceInvitationDto } from "@/features/invitations/workspace-dto";

afterEach(cleanup);

function workspaceFixture(): WorkspaceInvitationDto {
  const runtime = getTemplateRuntimeManifest("template-1", 1);
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

    fireEvent.change(firstNameInput, { target: { value: "Naya" } });
    expect(firstNameInput).toHaveValue("Naya");
    expect(screen.getAllByText(/Naya/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("textbox", { name: "Pesan pembuka" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Pesan penutup" })).not.toBeInTheDocument();
  });
});
