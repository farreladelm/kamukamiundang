"use server";

import { db } from "@/lib/server/db";
import { requireCustomer } from "@/features/auth/policies";
import {
  assertWorkspaceRuntime,
  type WorkspaceDraft,
  workspaceDraftSchema,
} from "@/features/invitations/workspace-dto";
import { MAX_GIFT_ACCOUNTS, MAX_STORY_ENTRIES } from "@/features/invitations/content-schema";
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

function parseFormCount(value: FormDataEntryValue | null, max: number) {
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? Math.min(count, max) : 0;
}

export type WorkspaceSaveResult =
  | { status: "success"; contentVersion: number }
  | { status: "conflict"; currentContentVersion: number }
  | { status: "locked" }
  | { status: "unavailable" };

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

  let runtime: ReturnType<typeof assertWorkspaceRuntime>;
  try {
    runtime = assertWorkspaceRuntime(
      invitation.templateKey,
      invitation.templateVersion,
      invitation.contentSchemaVersion,
      invitation.paletteKey,
    );
  } catch {
    return { status: "unavailable" };
  }

  const content: WorkspaceDraft = {
    ...input.content,
    story: runtime.capabilities.includes("story") ? input.content.story : null,
    gift: runtime.capabilities.includes("gift") ? input.content.gift : null,
  };
  const result = await db.invitationContent.updateMany({
    where: {
      invitationId: invitation.id,
      contentVersion: input.expectedContentVersion,
      contentSchemaVersion: invitation.contentSchemaVersion,
    },
    data: {
      content: content as Prisma.InputJsonObject,
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
      mainEvent: formData.get("mainEventLabel") === null ? null : {
        label: formData.get("mainEventLabel"),
        date: formData.get("mainEventDate"),
        time: formData.get("mainEventTime"),
        timeZone: formData.get("mainEventTimeZone"),
        venue: formData.get("mainEventVenue"),
        address: formData.get("mainEventAddress"),
        mapUrl: formData.get("mainEventMapUrl"),
      },
      secondaryEvent: formData.get("secondaryEventLabel") === null ? null : {
        label: formData.get("secondaryEventLabel"),
        date: formData.get("secondaryEventDate"),
        time: formData.get("secondaryEventTime"),
        timeZone: formData.get("secondaryEventTimeZone"),
        venue: formData.get("secondaryEventVenue"),
        address: formData.get("secondaryEventAddress"),
        mapUrl: formData.get("secondaryEventMapUrl"),
      },
      story: formData.get("storyEnabled") === null ? null : {
        intro: formData.get("storyIntro"),
        entries: Array.from({ length: parseFormCount(formData.get("storyEntryCount"), MAX_STORY_ENTRIES) }, (_, index) => ({
          title: formData.get(`storyEntryTitle_${index}`),
          text: formData.get(`storyEntryText_${index}`),
        })),
      },
      gift: formData.get("giftEnabled") === null ? null : {
        accounts: Array.from({ length: parseFormCount(formData.get("giftAccountCount"), MAX_GIFT_ACCOUNTS) }, (_, index) => ({
          bank: formData.get(`giftAccountBank_${index}`),
          accountNumber: formData.get(`giftAccountAccountNumber_${index}`),
          accountName: formData.get(`giftAccountAccountName_${index}`),
        })),
        physicalAddress: formData.get("giftPhysicalAddress"),
      },
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
