import "server-only";

import { z } from "zod";
import { db } from "@/lib/server/db";
import { requireAdmin, requireCustomer } from "@/features/auth/policies";

export const RESPONSE_PAGE_SIZE = 20;
export const MAX_RESPONSE_CURSOR_LENGTH = 512;

export type ResponseCursor = {
  createdAt: Date;
  id: string;
};

export type ResponsePage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type RsvpResponseItem = {
  id: string;
  name: string;
  attendance: "ATTENDING" | "NOT_ATTENDING" | "UNDECIDED";
  guestCount: number;
  eventKeys: string[];
  createdAt: string;
};

export type WishResponseItem = {
  id: string;
  name: string;
  message: string;
  visibility: "VISIBLE" | "HIDDEN";
  createdAt: string;
};

export type ResponseManagementData = {
  invitation: {
    id: string;
    customerName: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    editingEnabled: boolean;
    slug: string | null;
  };
  rsvps: ResponsePage<RsvpResponseItem>;
  wishes: ResponsePage<WishResponseItem>;
};

export class InvalidResponseCursorError extends Error {
  constructor(message = "Cursor respons tidak valid.") {
    super(message);
    this.name = "InvalidResponseCursorError";
  }
}

const cursorSchema = z
  .object({
    createdAt: z.string().datetime(),
    id: z.string().uuid(),
  })
  .strict();

export function encodeResponseCursor(cursor: ResponseCursor): string {
  const json = JSON.stringify({
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
  });
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeResponseCursor(
  value: string | string[] | undefined,
): ResponseCursor | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    throw new InvalidResponseCursorError("Cursor tidak boleh berupa array.");
  }
  if (typeof value !== "string" || value.length > MAX_RESPONSE_CURSOR_LENGTH) {
    throw new InvalidResponseCursorError("Panjang cursor melebihi batas yang diizinkan.");
  }
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new InvalidResponseCursorError("Karakter cursor tidak valid.");
  }

  try {
    const raw = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);
    const validated = cursorSchema.parse(parsed);
    return {
      createdAt: new Date(validated.createdAt),
      id: validated.id,
    };
  } catch {
    throw new InvalidResponseCursorError();
  }
}

function buildKeysetWhere(cursor?: ResponseCursor) {
  if (!cursor) return {};
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      {
        createdAt: cursor.createdAt,
        id: { lt: cursor.id },
      },
    ],
  };
}

function buildRsvpPage(
  rows: Array<{
    id: string;
    name: string;
    attendance: "ATTENDING" | "NOT_ATTENDING" | "UNDECIDED";
    guestCount: number;
    eventKeys: string[];
    createdAt: Date;
  }>,
): ResponsePage<RsvpResponseItem> {
  const hasMore = rows.length > RESPONSE_PAGE_SIZE;
  const items = rows.slice(0, RESPONSE_PAGE_SIZE);
  const nextCursor =
    hasMore && items.length > 0
      ? encodeResponseCursor({
          createdAt: items[items.length - 1]!.createdAt,
          id: items[items.length - 1]!.id,
        })
      : null;

  return {
    items: items.map((r) => ({
      id: r.id,
      name: r.name,
      attendance: r.attendance,
      guestCount: r.guestCount,
      eventKeys: r.eventKeys,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor,
  };
}

function buildWishPage(
  rows: Array<{
    id: string;
    name: string;
    message: string;
    visibility: "VISIBLE" | "HIDDEN";
    createdAt: Date;
  }>,
): ResponsePage<WishResponseItem> {
  const hasMore = rows.length > RESPONSE_PAGE_SIZE;
  const items = rows.slice(0, RESPONSE_PAGE_SIZE);
  const nextCursor =
    hasMore && items.length > 0
      ? encodeResponseCursor({
          createdAt: items[items.length - 1]!.createdAt,
          id: items[items.length - 1]!.id,
        })
      : null;

  return {
    items: items.map((w) => ({
      id: w.id,
      name: w.name,
      message: w.message,
      visibility: w.visibility,
      createdAt: w.createdAt.toISOString(),
    })),
    nextCursor,
  };
}

export async function getCustomerInvitationResponses(input: {
  invitationId: string;
  rsvpCursor?: ResponseCursor;
  wishCursor?: ResponseCursor;
}): Promise<ResponseManagementData | null> {
  let customerId: string;
  try {
    const actor = await requireCustomer();
    customerId = actor.customer.id;
  } catch {
    return null;
  }

  const invitation = await db.invitation.findFirst({
    where: {
      id: input.invitationId,
      customerId,
      status: { not: "ARCHIVED" },
    },
    include: {
      customer: {
        select: { name: true },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  const rsvpCursorWhere = buildKeysetWhere(input.rsvpCursor);
  const wishCursorWhere = buildKeysetWhere(input.wishCursor);

  const [rsvps, wishes] = await Promise.all([
    db.rsvp.findMany({
      where: {
        invitationId: input.invitationId,
        invitation: {
          customerId,
          status: { not: "ARCHIVED" },
        },
        ...rsvpCursorWhere,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: RESPONSE_PAGE_SIZE + 1,
    }),
    db.wish.findMany({
      where: {
        invitationId: input.invitationId,
        invitation: {
          customerId,
          status: { not: "ARCHIVED" },
        },
        deletedAt: null,
        ...wishCursorWhere,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: RESPONSE_PAGE_SIZE + 1,
    }),
  ]);

  return {
    invitation: {
      id: invitation.id,
      customerName: invitation.customer.name,
      status: invitation.status,
      editingEnabled: invitation.editingEnabled,
      slug: invitation.slug,
    },
    rsvps: buildRsvpPage(rsvps),
    wishes: buildWishPage(wishes),
  };
}

export async function getAdminInvitationResponses(input: {
  invitationId: string;
  rsvpCursor?: ResponseCursor;
  wishCursor?: ResponseCursor;
}): Promise<ResponseManagementData | null> {
  await requireAdmin();

  const invitation = await db.invitation.findUnique({
    where: {
      id: input.invitationId,
    },
    include: {
      customer: {
        select: { name: true },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  const rsvpCursorWhere = buildKeysetWhere(input.rsvpCursor);
  const wishCursorWhere = buildKeysetWhere(input.wishCursor);

  const [rsvps, wishes] = await Promise.all([
    db.rsvp.findMany({
      where: {
        invitationId: input.invitationId,
        ...rsvpCursorWhere,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: RESPONSE_PAGE_SIZE + 1,
    }),
    db.wish.findMany({
      where: {
        invitationId: input.invitationId,
        deletedAt: null,
        ...wishCursorWhere,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: RESPONSE_PAGE_SIZE + 1,
    }),
  ]);

  return {
    invitation: {
      id: invitation.id,
      customerName: invitation.customer.name,
      status: invitation.status,
      editingEnabled: invitation.editingEnabled,
      slug: invitation.slug,
    },
    rsvps: buildRsvpPage(rsvps),
    wishes: buildWishPage(wishes),
  };
}
