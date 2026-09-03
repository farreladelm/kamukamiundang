import "server-only";

import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import { rsvpSubmissionSchema } from "@/features/forms/schemas";
import { db } from "@/lib/server/db";
import { toTemplateContentViewModel } from "./content-schema";
import { validateWorkspaceDraft } from "./workspace-dto";
import type { z } from "zod";

export const RSVP_RATE_LIMIT = 5;
export const RSVP_RATE_WINDOW_MS = 15 * 60_000;

export type RsvpSubmission = z.infer<typeof rsvpSubmissionSchema>;

type RsvpResult =
  | { status: "created"; invitationId: string; guestCount: number; eventKeys: string[] }
  | { status: "duplicate"; invitationId: string; guestCount: number; eventKeys: string[] }
  | { status: "ignored"; invitationId: string };

export class RsvpSubmissionError extends Error {
  constructor(
    public readonly code: "not_found" | "unavailable" | "capacity" | "rate_limited",
    message: string,
  ) {
    super(message);
    this.name = "RsvpSubmissionError";
  }
}

const rateLimitTimestamps = new Map<string, number[]>();

function allowRateLimitedSubmission(key: string, now = Date.now()) {
  const timestamps = (rateLimitTimestamps.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RSVP_RATE_WINDOW_MS,
  );
  if (timestamps.length >= RSVP_RATE_LIMIT) {
    rateLimitTimestamps.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimitTimestamps.set(key, timestamps);
  return true;
}

function getEventKeysAndCapacities(
  snapshot: {
    templateKey: string;
    templateVersion: number;
    contentSchemaVersion: number;
    paletteKey: string;
    content: unknown;
  },
) {
  const runtime = getTemplateRuntimeManifest(snapshot.templateKey, snapshot.templateVersion);
  if (
    !runtime
    || runtime.contentSchemaVersion !== snapshot.contentSchemaVersion
    || !runtime.palettes.some((palette) => palette.key === snapshot.paletteKey)
    || !runtime.capabilities.includes("rsvp")
  ) {
    throw new RsvpSubmissionError("unavailable", "RSVP tidak tersedia.");
  }

  try {
    const draft = validateWorkspaceDraft(snapshot.content);
    const content = toTemplateContentViewModel(draft, runtime.demo.content, runtime.capabilities);
    if (!content.rsvp || !draft.rsvp.enabled || !content.rsvp.events?.length) {
      throw new RsvpSubmissionError("unavailable", "RSVP tidak tersedia.");
    }

    return {
      maxGuests: content.rsvp.maxGuests,
      events: new Map(content.rsvp.events.map((event) => [event.key, event.capacity])),
    };
  } catch (error) {
    if (error instanceof RsvpSubmissionError) throw error;
    throw new RsvpSubmissionError("unavailable", "RSVP tidak tersedia.");
  }
}

export async function submitRsvp({
  slug,
  idempotencyKey,
  clientKey,
  submission,
}: {
  slug: string;
  idempotencyKey: string;
  clientKey: string;
  submission: RsvpSubmission;
}): Promise<RsvpResult> {
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
      throw new RsvpSubmissionError("not_found", "Invitation tidak tersedia.");
    }

    const existing = await tx.rsvp.findUnique({
      where: { invitationId_idempotencyKey: { invitationId: invitation.id, idempotencyKey } },
      select: { guestCount: true, eventKeys: true },
    });
    if (existing) {
      return {
        status: "duplicate" as const,
        invitationId: invitation.id,
        guestCount: existing.guestCount,
        eventKeys: existing.eventKeys,
      };
    }

    if (!allowRateLimitedSubmission(`${slug}:${clientKey}`)) {
      throw new RsvpSubmissionError("rate_limited", "Terlalu banyak percobaan. Coba lagi nanti.");
    }

    if (submission.honeypot) {
      return { status: "ignored" as const, invitationId: invitation.id };
    }

    const config = getEventKeysAndCapacities(invitation.snapshot);
    if (submission.guestCount > config.maxGuests) {
      throw new RsvpSubmissionError("unavailable", "Jumlah tamu melebihi batas RSVP.");
    }

    for (const eventKey of submission.eventKeys) {
      if (!config.events.has(eventKey)) {
        throw new RsvpSubmissionError("unavailable", "Pilihan acara tidak tersedia.");
      }
    }

    if (submission.attendance === "ATTENDING") {
      const attendingRsvps = await tx.rsvp.findMany({
        where: { invitationId: invitation.id, attendance: "ATTENDING" },
        select: { guestCount: true, eventKeys: true },
      });
      for (const eventKey of submission.eventKeys) {
        const used = attendingRsvps.reduce(
          (total, rsvp) => total + (rsvp.eventKeys.includes(eventKey) ? rsvp.guestCount : 0),
          0,
        );
        if (used + submission.guestCount > (config.events.get(eventKey) ?? 0)) {
          throw new RsvpSubmissionError("capacity", "Kapasitas acara sudah penuh.");
        }
      }
    }

    const guestCount = submission.attendance === "ATTENDING" ? submission.guestCount : 0;
    const eventKeys = submission.attendance === "ATTENDING" ? submission.eventKeys : [];
    const created = await tx.rsvp.create({
      data: {
        invitationId: invitation.id,
        name: submission.name,
        attendance: submission.attendance,
        guestCount,
        eventKeys,
        idempotencyKey,
      },
      select: { id: true },
    });

    return {
      status: "created" as const,
      invitationId: invitation.id,
      guestCount,
      eventKeys,
      id: created.id,
    };
  });

  if (result.status !== "ignored") {
    await db.analyticsEvent.create({
      data: {
        name: "rsvp_submitted",
        properties: { invitationId: result.invitationId, result: result.status },
      },
    }).catch(() => undefined);
  }

  return result;
}
