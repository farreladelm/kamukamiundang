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
      couple: { firstName: "Rani", secondName: "Dimas" },
      profiles: [
        { name: "Rani Prameswari", parents: "Putri Bapak Hadi dan Ibu Rani" },
        { name: "Dimas Adinata", parents: "Putra Bapak Surya dan Ibu Ratih" },
      ],
      opening: "Kami mengundang Anda.",
      quote: "Doa terbaik untuk kami.",
      closing: "Sampai jumpa di hari bahagia kami.",
    },
    palettes: runtime.palettes,
  };
}

describe("WorkspaceEditor", () => {
  it("renders typed fields and previews current local draft content", () => {
    render(<WorkspaceEditor workspace={workspaceFixture()} />);

    const firstNameInput = screen.getByRole("textbox", { name: "Nama mempelai pertama" });
    expect(firstNameInput).toHaveValue("Rani");
    expect(screen.getByText("template-1 v1")).toBeInTheDocument();
    expect(screen.getAllByText(/Rani/).length).toBeGreaterThan(0);

    fireEvent.change(firstNameInput, { target: { value: "Naya" } });
    expect(firstNameInput).toHaveValue("Naya");
    expect(screen.getAllByText(/Naya/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("textbox", { name: "Draft JSON" })).not.toBeInTheDocument();
  });
});
