"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/server/db";
import { requireAdmin, requireCustomer } from "@/features/auth/policies";
import {
  type FormActionState,
  formErrorState,
  successState,
} from "@/features/forms/action-state";

const wishModerationSchema = z
  .object({
    invitationId: z.string().uuid(),
    wishId: z.string().uuid(),
    intent: z.enum(["hide", "unhide", "delete"]),
  })
  .strict();

export async function moderateCustomerWishAction(
  invitationId: string,
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parseResult = wishModerationSchema.safeParse({
    invitationId,
    wishId: formData.get("wishId"),
    intent: formData.get("intent"),
  });

  if (!parseResult.success) {
    return formErrorState("Aksi ucapan tidak valid.");
  }

  const { wishId, intent } = parseResult.data;

  let customerId: string;
  try {
    const actor = await requireCustomer();
    customerId = actor.customer.id;
  } catch {
    return formErrorState("Sesi customer tidak tersedia.");
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findFirst({
        where: {
          id: invitationId,
          customerId,
          status: { not: "ARCHIVED" },
        },
        select: { slug: true },
      });

      if (!invitation) {
        return null;
      }

      const actorScope = {
        customerId,
        status: { not: "ARCHIVED" as const },
      };

      let count = 0;
      let auditAction: "HIDDEN" | "UNHIDDEN" | "DELETED";

      if (intent === "hide") {
        const updateRes = await tx.wish.updateMany({
          where: {
            id: wishId,
            invitationId,
            visibility: "VISIBLE",
            deletedAt: null,
            invitation: actorScope,
          },
          data: { visibility: "HIDDEN" },
        });
        count = updateRes.count;
        auditAction = "HIDDEN";
      } else if (intent === "unhide") {
        const updateRes = await tx.wish.updateMany({
          where: {
            id: wishId,
            invitationId,
            visibility: "HIDDEN",
            deletedAt: null,
            invitation: actorScope,
          },
          data: { visibility: "VISIBLE" },
        });
        count = updateRes.count;
        auditAction = "UNHIDDEN";
      } else {
        const delRes = await tx.wish.deleteMany({
          where: {
            id: wishId,
            invitationId,
            deletedAt: null,
            invitation: actorScope,
          },
        });
        count = delRes.count;
        auditAction = "DELETED";
      }

      if (count !== 1) {
        return null;
      }

      await tx.auditEvent.create({
        data: {
          actorType: "CUSTOMER",
          actorId: customerId,
          entityType: "Wish",
          entityId: wishId,
          action: auditAction,
          properties: { invitationId },
        },
      });

      return { slug: invitation.slug, intent };
    });

    if (!result) {
      return formErrorState("Ucapan sudah berubah atau tidak tersedia. Muat ulang halaman.");
    }

    revalidatePath(`/workspace/invitations/${invitationId}/responses`);
    revalidatePath(`/admin/invitations/${invitationId}/responses`);
    if (result.slug) {
      revalidatePath(`/i/${result.slug}`);
    }

    if (intent === "hide") return successState("Ucapan disembunyikan.");
    if (intent === "unhide") return successState("Ucapan ditampilkan kembali.");
    return successState("Ucapan dihapus permanen.");
  } catch {
    return formErrorState("Perubahan ucapan tidak dapat disimpan.");
  }
}

export async function moderateAdminWishAction(
  invitationId: string,
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const parseResult = wishModerationSchema.safeParse({
    invitationId,
    wishId: formData.get("wishId"),
    intent: formData.get("intent"),
  });

  if (!parseResult.success) {
    return formErrorState("Aksi ucapan tidak valid.");
  }

  const { wishId, intent } = parseResult.data;

  const actor = await requireAdmin();
  const adminId = actor.admin.id;

  try {
    const result = await db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        select: { slug: true },
      });

      if (!invitation) {
        return null;
      }

      let count = 0;
      let auditAction: "HIDDEN" | "UNHIDDEN" | "DELETED";

      if (intent === "hide") {
        const updateRes = await tx.wish.updateMany({
          where: {
            id: wishId,
            invitationId,
            visibility: "VISIBLE",
            deletedAt: null,
          },
          data: { visibility: "HIDDEN" },
        });
        count = updateRes.count;
        auditAction = "HIDDEN";
      } else if (intent === "unhide") {
        const updateRes = await tx.wish.updateMany({
          where: {
            id: wishId,
            invitationId,
            visibility: "HIDDEN",
            deletedAt: null,
          },
          data: { visibility: "VISIBLE" },
        });
        count = updateRes.count;
        auditAction = "UNHIDDEN";
      } else {
        const delRes = await tx.wish.deleteMany({
          where: {
            id: wishId,
            invitationId,
            deletedAt: null,
          },
        });
        count = delRes.count;
        auditAction = "DELETED";
      }

      if (count !== 1) {
        return null;
      }

      await tx.auditEvent.create({
        data: {
          actorType: "ADMIN",
          actorId: adminId,
          entityType: "Wish",
          entityId: wishId,
          action: auditAction,
          properties: { invitationId },
        },
      });

      return { slug: invitation.slug, intent };
    });

    if (!result) {
      return formErrorState("Ucapan sudah berubah atau tidak tersedia. Muat ulang halaman.");
    }

    revalidatePath(`/workspace/invitations/${invitationId}/responses`);
    revalidatePath(`/admin/invitations/${invitationId}/responses`);
    if (result.slug) {
      revalidatePath(`/i/${result.slug}`);
    }

    if (intent === "hide") return successState("Ucapan disembunyikan.");
    if (intent === "unhide") return successState("Ucapan ditampilkan kembali.");
    return successState("Ucapan dihapus permanen.");
  } catch {
    return formErrorState("Perubahan ucapan tidak dapat disimpan.");
  }
}
