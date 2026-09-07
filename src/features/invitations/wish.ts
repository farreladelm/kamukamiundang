import "server-only";

import { wishSubmissionSchema } from "@/features/forms/schemas";
import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import { db } from "@/lib/server/db";
import { validateWorkspaceDraft } from "./workspace-dto";
import type { z } from "zod";

export const WISH_RATE_LIMIT = 5;
export const WISH_RATE_WINDOW_MS = 15 * 60_000;
const MAX_RATE_LIMIT_KEYS = 10_000;

export type WishSubmission = z.infer<typeof wishSubmissionSchema>;

type WishResult =
  | { status: "created"; invitationId: string }
  | { status: "duplicate"; invitationId: string }
  | { status: "ignored"; invitationId: string };

export class WishSubmissionError extends Error {
  constructor(
    public readonly code: "not_found" | "unavailable" | "rate_limited",
    message: string,
  ) {
    super(message);
    this.name = "WishSubmissionError";
  }
}

const rateLimitTimestamps = new Map<string, number[]>();

function allowRateLimitedSubmission(key: string, now = Date.now()) {
  for (const [storedKey, storedTimestamps] of rateLimitTimestamps) {
    const activeTimestamps = storedTimestamps.filter(
      (timestamp) => now - timestamp < WISH_RATE_WINDOW_MS,
    );
    if (activeTimestamps.length === 0) rateLimitTimestamps.delete(storedKey);
    else rateLimitTimestamps.set(storedKey, activeTimestamps);
  }

  if (!rateLimitTimestamps.has(key)) {
    while (rateLimitTimestamps.size >= MAX_RATE_LIMIT_KEYS) {
      const oldestKey = rateLimitTimestamps.keys().next().value;
      if (oldestKey === undefined) break;
      rateLimitTimestamps.delete(oldestKey);
    }
  }

  const timestamps = (rateLimitTimestamps.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WISH_RATE_WINDOW_MS,
  );
  if (timestamps.length >= WISH_RATE_LIMIT) {
    rateLimitTimestamps.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitTimestamps.set(key, timestamps);
  return true;
}

function assertWishAvailability(snapshot: {
  templateKey: string;
  templateVersion: number;
  contentSchemaVersion: number;
  paletteKey: string;
  content: unknown;
}) {
  const runtime = getTemplateRuntimeManifest(snapshot.templateKey, snapshot.templateVersion);
  if (
    !runtime
    || runtime.contentSchemaVersion !== snapshot.contentSchemaVersion
    || !runtime.palettes.some((palette) => palette.key === snapshot.paletteKey)
    || !runtime.capabilities.includes("wishes")
  ) {
    throw new WishSubmissionError("unavailable", "Ucapan tidak tersedia.");
  }

  try {
    const draft = validateWorkspaceDraft(snapshot.content);
    if (!draft.wishes.enabled) throw new WishSubmissionError("unavailable", "Ucapan tidak tersedia.");
  } catch (error) {
    if (error instanceof WishSubmissionError) throw error;
    throw new WishSubmissionError("unavailable", "Ucapan tidak tersedia.");
  }
}

export async function submitWish({
  slug,
  idempotencyKey,
  clientKey,
  submission,
}: {
  slug: string;
  idempotencyKey: string;
  clientKey: string;
  submission: WishSubmission;
}): Promise<WishResult> {
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Invitation" WHERE "slug" = ${slug} AND "status" = 'PUBLISHED' FOR UPDATE`;
    const invitation = await tx.invitation.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        id: true,
        snapshot: {
          select: {
            templateKey: true,
            templateVersion: true,
            contentSchemaVersion: true,
            paletteKey: true,
            content: true,
          },
        },
      },
    });

    if (!invitation?.snapshot) {
      throw new WishSubmissionError("not_found", "Invitation tidak tersedia.");
    }

    const existing = await tx.wish.findUnique({
      where: { invitationId_idempotencyKey: { invitationId: invitation.id, idempotencyKey } },
      select: { id: true },
    });
    if (existing) return { status: "duplicate" as const, invitationId: invitation.id };

    if (!allowRateLimitedSubmission(`${slug}:${clientKey}`)) {
      throw new WishSubmissionError("rate_limited", "Terlalu banyak percobaan. Coba lagi nanti.");
    }

    if (submission.honeypot) return { status: "ignored" as const, invitationId: invitation.id };

    assertWishAvailability(invitation.snapshot);
    await tx.wish.create({
      data: {
        invitationId: invitation.id,
        name: submission.name,
        message: submission.message,
        visibility: "VISIBLE",
        idempotencyKey,
      },
      select: { id: true },
    });

    return { status: "created" as const, invitationId: invitation.id };
  });

  if (result.status !== "ignored") {
    await db.analyticsEvent.create({
      data: {
        name: "wish_submitted",
        properties: { invitationId: result.invitationId, result: result.status },
      },
    }).catch(() => undefined);
  }

  return result;
}
