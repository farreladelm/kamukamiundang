"use server";

import { db } from "@/lib/server/db";
import { requireCustomer } from "@/features/auth/policies";
import {
  assertWorkspaceRuntime,
  type WorkspaceDraft,
  workspaceDraftSchema,
} from "@/features/invitations/workspace-dto";
import {
  initialWorkspaceSaveState,
  type WorkspaceSaveState,
} from "./action-state";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const workspaceSaveInputSchema = z.object({
  invitationId: z.string().uuid("Invitation tidak valid."),
  expectedContentVersion: z.coerce
    .number()
    .int("Versi draft tidak valid.")
    .nonnegative("Versi draft tidak valid."),
  content: workspaceDraftSchema,
});

type WorkspaceSaveInput = {
  customerId: string;
  invitationId: string;
  expectedContentVersion: number;
  content: WorkspaceDraft;
};

export type WorkspaceSaveResult =
  | { status: "success"; contentVersion: number }
  | { status: "conflict"; currentContentVersion: number }
  | { status: "locked" }
  | { status: "unavailable" };

const typedDraftKeys = new Set(["bride", "groom", "quoteKey"]);

function getLegacyMvp19Draft(content: unknown): unknown {
  if (!content || typeof content !== "object" || Array.isArray(content)) return content;

  const draft = content as Record<string, unknown>;
  if (Object.keys(draft).length === 0) return undefined;
  if ("legacyMvp19Draft" in draft) return draft.legacyMvp19Draft;
  if (Object.keys(draft).every((key) => typedDraftKeys.has(key))) return undefined;

  return content;
}

export async function saveWorkspaceDraftForCustomer(
  input: WorkspaceSaveInput,
): Promise<WorkspaceSaveResult> {
  const invitation = await db.invitation.findFirst({
    where: {
      id: input.invitationId,
      customerId: input.customerId,
      status: { not: "ARCHIVED" },
    },
    select: {
      id: true,
      editingEnabled: true,
      templateKey: true,
      templateVersion: true,
      contentSchemaVersion: true,
      paletteKey: true,
    },
  });

  if (!invitation) return { status: "unavailable" };
  if (!invitation.editingEnabled) return { status: "locked" };

  try {
    assertWorkspaceRuntime(
      invitation.templateKey,
      invitation.templateVersion,
      invitation.contentSchemaVersion,
      invitation.paletteKey,
    );
  } catch {
    return { status: "unavailable" };
  }

  const currentContent = await db.invitationContent.findFirst({
    where: {
      invitationId: invitation.id,
      contentVersion: input.expectedContentVersion,
      contentSchemaVersion: invitation.contentSchemaVersion,
    },
    select: { content: true },
  });
  const legacyMvp19Draft = currentContent
    ? getLegacyMvp19Draft(currentContent.content)
    : undefined;
  const nextContent = legacyMvp19Draft === undefined
    ? input.content
    : { ...input.content, legacyMvp19Draft };

  const result = await db.invitationContent.updateMany({
    where: {
      invitationId: invitation.id,
      contentVersion: input.expectedContentVersion,
      contentSchemaVersion: invitation.contentSchemaVersion,
    },
    data: {
      // MVP-19 accepted arbitrary root JSON. Retain it until a later migration can interpret it.
      content: nextContent as Prisma.InputJsonObject,
      contentVersion: input.expectedContentVersion + 1,
      updatedByActorType: "CUSTOMER",
      updatedByActorId: input.customerId,
    },
  });

  if (result.count === 1) {
    return { status: "success", contentVersion: input.expectedContentVersion + 1 };
  }

  const current = await db.invitationContent.findUnique({
    where: { invitationId: invitation.id },
    select: { contentVersion: true },
  });

  if (!current) return { status: "unavailable" };
  return { status: "conflict", currentContentVersion: current.contentVersion };
}

function parseWorkspaceFormData(formData: FormData) {
  return workspaceSaveInputSchema.safeParse({
    invitationId: formData.get("invitationId"),
    expectedContentVersion: formData.get("expectedContentVersion"),
    content: {
      bride: {
        nickname: formData.get("brideNickname"),
        fullName: formData.get("brideFullName"),
        fatherName: formData.get("brideFatherName"),
        motherName: formData.get("brideMotherName"),
      },
      groom: {
        nickname: formData.get("groomNickname"),
        fullName: formData.get("groomFullName"),
        fatherName: formData.get("groomFatherName"),
        motherName: formData.get("groomMotherName"),
      },
      quoteKey: formData.get("quoteKey"),
    },
  });
}

export async function saveWorkspaceDraftAction(
  _previousState: WorkspaceSaveState = initialWorkspaceSaveState,
  formData?: FormData,
): Promise<WorkspaceSaveState> {
  void _previousState;

  let customerId: string;
  try {
    ({ customer: { id: customerId } } = await requireCustomer());
  } catch {
    return {
      status: "error",
      code: "UNAVAILABLE",
      contentVersion: _previousState.contentVersion,
      message: "Workspace tidak tersedia.",
    };
  }

  const parsed = parseWorkspaceFormData(formData ?? new FormData());
  if (!parsed.success) {
    return {
      status: "error",
      code: "INVALID",
      contentVersion: _previousState.contentVersion,
      message: "Periksa data draft sebelum menyimpan.",
    };
  }

  const result = await saveWorkspaceDraftForCustomer({
    customerId,
    ...parsed.data,
  });

  if (result.status === "success") {
    return {
      status: "success",
      message: "Draft tersimpan.",
      contentVersion: result.contentVersion,
    };
  }
  if (result.status === "conflict") {
    return {
      status: "error",
      code: "CONFLICT",
      contentVersion: _previousState.contentVersion,
      message: "Draft berubah di tab atau perangkat lain. Periksa versi terbaru sebelum menyimpan lagi.",
      currentContentVersion: result.currentContentVersion,
    };
  }
  if (result.status === "locked") {
    return {
      status: "error",
      code: "LOCKED",
      contentVersion: _previousState.contentVersion,
      message: "Workspace sedang dikunci oleh admin.",
    };
  }

  return {
    status: "error",
    code: "UNAVAILABLE",
    contentVersion: _previousState.contentVersion,
    message: "Workspace tidak tersedia.",
  };
}
