import "server-only";

import { db } from "@/lib/server/db";
import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import type { TemplatePalette } from "@/features/templates/types";
import { requireCustomer } from "@/features/auth/policies";
import {
  emptyWorkspaceDraft,
  type WorkspaceDraft,
  workspaceDraftSchema,
} from "./content-schema";

export { type WorkspaceDraft, workspaceDraftSchema } from "./content-schema";

export type WorkspaceInvitationDto = {
  invitationId: string;
  templateKey: string;
  templateVersion: number;
  contentSchemaVersion: number;
  paletteKey: string;
  contentVersion: number;
  draft: WorkspaceDraft;
  palettes: readonly TemplatePalette[];
};

export class WorkspaceUnavailableError extends Error {
  constructor() {
    super("Workspace unavailable");
    this.name = "WorkspaceUnavailableError";
  }
}

function getValidatedRuntime(
  templateKey: string,
  templateVersion: number,
  contentSchemaVersion: number,
  paletteKey: string,
) {
  const runtime = getTemplateRuntimeManifest(templateKey, templateVersion);

  if (
    !runtime ||
    runtime.contentSchemaVersion !== contentSchemaVersion ||
    !runtime.palettes.some((palette) => palette.key === paletteKey)
  ) {
    throw new WorkspaceUnavailableError();
  }

  return runtime;
}

export function validateWorkspaceDraft(content: unknown): WorkspaceDraft {
  const parsed = workspaceDraftSchema.safeParse(content);

  if (!parsed.success) {
    if (content && typeof content === "object" && Object.keys(content).length === 0) {
      return emptyWorkspaceDraft;
    }
    throw new WorkspaceUnavailableError();
  }
  return parsed.data;
}

export function assertWorkspaceRuntime(
  templateKey: string,
  templateVersion: number,
  contentSchemaVersion: number,
  paletteKey: string,
) {
  return getValidatedRuntime(
    templateKey,
    templateVersion,
    contentSchemaVersion,
    paletteKey,
  );
}

export async function getWorkspaceInvitationDto(
  invitationId: string,
): Promise<WorkspaceInvitationDto> {
  const { customer } = await requireCustomer();
  return getWorkspaceInvitationDtoForCustomer(invitationId, customer.id);
}

export async function getWorkspaceInvitationDtoForCustomer(
  invitationId: string,
  customerId: string,
): Promise<WorkspaceInvitationDto> {
  const invitation = await db.invitation.findFirst({
    where: {
      id: invitationId,
      customerId,
      editingEnabled: true,
      status: { not: "ARCHIVED" },
    },
  });

  if (!invitation) throw new WorkspaceUnavailableError();

  const content = await db.invitationContent.findUnique({
    where: { invitationId: invitation.id },
  });

  if (!content || content.contentSchemaVersion !== invitation.contentSchemaVersion) {
    throw new WorkspaceUnavailableError();
  }

  const runtime = getValidatedRuntime(
    invitation.templateKey,
    invitation.templateVersion,
    invitation.contentSchemaVersion,
    invitation.paletteKey,
  );

  return {
    invitationId: invitation.id,
    templateKey: invitation.templateKey,
    templateVersion: invitation.templateVersion,
    contentSchemaVersion: invitation.contentSchemaVersion,
    paletteKey: invitation.paletteKey,
    contentVersion: content.contentVersion,
    draft: validateWorkspaceDraft(content.content),
    palettes: runtime.palettes,
  };
}
