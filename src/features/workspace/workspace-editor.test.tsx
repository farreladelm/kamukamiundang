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
    draft: { draftNote: "keep this input" },
    palettes: runtime.palettes,
  };
}

describe("WorkspaceEditor", () => {
  it("renders pinned preview and retains edited local draft input", () => {
    render(<WorkspaceEditor workspace={workspaceFixture()} />);

    const draftInput = screen.getByRole("textbox", { name: "Draft JSON" });
    expect(draftInput).toHaveValue('{\n  "draftNote": "keep this input"\n}');
    expect(screen.getByText("template-1 v1")).toBeInTheDocument();

    fireEvent.change(draftInput, { target: { value: '{\n  "draftNote": "local edit"\n}' } });
    expect(draftInput).toHaveValue('{\n  "draftNote": "local edit"\n}');
  });
});
