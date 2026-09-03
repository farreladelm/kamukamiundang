import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { workspaceDraftSchema } from "@/features/invitations/content-schema";
import { submitRsvp } from "@/features/invitations/rsvp";
import { POST } from "@/app/api/invitations/[slug]/rsvp/route";

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "SnapshotAsset", "PublishedSnapshot", "InvitationContent", "MagicLink", "Session", "Rsvp", "Wish", "Asset", "Invitation", "Order", "Customer", "Admin", "AnalyticsEvent" CASCADE',
  );
});

async function setupPublishedInvitation({
  mainCapacity = 5,
  secondaryCapacity = 5,
}: {
  mainCapacity?: number;
  secondaryCapacity?: number;
} = {}) {
  const customer = await db.customer.create({ data: { name: "Customer" } });
  const order = await db.order.create({
    data: {
      customerId: customer.id,
      templateKey: "template-2",
      templateVersion: 1,
      contentSchemaVersion: 2,
      paletteKey: "terakota",
      priceInRupiah: 100000,
      photoLimit: 20,
      storageQuotaBytes: BigInt(250) * BigInt(1024) * BigInt(1024),
      status: "PAID",
    },
  });
  const invitation = await db.invitation.create({
    data: {
      customerId: customer.id,
      orderId: order.id,
      templateKey: order.templateKey,
      templateVersion: order.templateVersion,
      contentSchemaVersion: order.contentSchemaVersion,
      paletteKey: order.paletteKey,
      slug: "rsvp-invitation",
      status: "PUBLISHED",
      editingEnabled: false,
      publishedAt: new Date(),
    },
  });
  const content = workspaceDraftSchema.parse({
    mainEvent: {
      label: "Akad Nikah",
      date: "2026-11-14",
      time: "08:00",
      timeZone: "Asia/Jakarta",
      venue: "Pendopo Joglo Sari",
      address: "Jl. Taman Sari No. 18, Yogyakarta",
      mapUrl: "https://maps.google.com/?q=Pendopo+Joglo+Sari",
    },
    secondaryEvent: {
      label: "Resepsi",
      date: "2026-11-14",
      time: "12:00",
      timeZone: "Asia/Jakarta",
      venue: "Pendopo Joglo Sari",
      address: "Jl. Taman Sari No. 18, Yogyakarta",
      mapUrl: "https://maps.google.com/?q=Pendopo+Joglo+Sari",
    },
    rsvp: {
      enabled: true,
      intro: "Mohon konfirmasi.",
      maxGuests: 3,
      eventCapacities: { mainEvent: mainCapacity, secondaryEvent: secondaryCapacity },
    },
  });
  await db.publishedSnapshot.create({
    data: {
      invitationId: invitation.id,
      templateKey: invitation.templateKey,
      templateVersion: invitation.templateVersion,
      contentSchemaVersion: invitation.contentSchemaVersion,
      paletteKey: invitation.paletteKey,
      content,
    },
  });

  return invitation;
}

function attendingSubmission(eventKeys: ("mainEvent" | "secondaryEvent")[] = ["mainEvent"], guestCount = 1) {
  return {
    name: "Guest",
    attendance: "ATTENDING" as const,
    guestCount,
    eventKeys,
    honeypot: "",
  };
}

describe("RSVP submissions", () => {
  it("creates one RSVP and returns the same result for an idempotent retry", async () => {
    const invitation = await setupPublishedInvitation();
    const input = {
      slug: invitation.slug!,
      idempotencyKey: "request-one",
      clientKey: "client-one",
      submission: attendingSubmission(["mainEvent", "secondaryEvent"], 2),
    };

    await expect(submitRsvp(input)).resolves.toMatchObject({ status: "created", guestCount: 2 });
    await expect(submitRsvp(input)).resolves.toMatchObject({ status: "duplicate", guestCount: 2 });
    await expect(db.rsvp.count({ where: { invitationId: invitation.id } })).resolves.toBe(1);
    await expect(db.analyticsEvent.findFirst({ where: { name: "rsvp_submitted" } })).resolves.toMatchObject({
      properties: { invitationId: invitation.id, result: "created" },
    });
  });

  it("enforces capacity independently for each selected event", async () => {
    const invitation = await setupPublishedInvitation({ mainCapacity: 2, secondaryCapacity: 1 });
    const base = { slug: invitation.slug!, clientKey: "capacity-client", submission: attendingSubmission(["mainEvent"], 2) };

    await expect(submitRsvp({ ...base, idempotencyKey: "capacity-one" })).resolves.toMatchObject({ status: "created" });
    await expect(
      submitRsvp({
        ...base,
        idempotencyKey: "capacity-two",
        submission: attendingSubmission(["secondaryEvent"], 2),
      }),
    ).rejects.toMatchObject({ code: "capacity" });
    await expect(
      submitRsvp({
        ...base,
        idempotencyKey: "capacity-three",
        submission: attendingSubmission(["mainEvent"], 1),
      }),
    ).rejects.toMatchObject({ code: "capacity" });
  });

  it("does not reserve capacity for declined or undecided guests", async () => {
    const invitation = await setupPublishedInvitation({ mainCapacity: 1, secondaryCapacity: 0 });
    for (const attendance of ["NOT_ATTENDING", "UNDECIDED"] as const) {
      await expect(submitRsvp({
        slug: invitation.slug!,
        idempotencyKey: `no-seat-${attendance}`,
        clientKey: `client-${attendance}`,
        submission: { name: "Guest", attendance, guestCount: 0, eventKeys: [], honeypot: "" },
      })).resolves.toMatchObject({ status: "created", guestCount: 0, eventKeys: [] });
    }

    await expect(submitRsvp({
      slug: invitation.slug!,
      idempotencyKey: "seat-one",
      clientKey: "seat-client",
      submission: attendingSubmission(["mainEvent"], 1),
    })).resolves.toMatchObject({ status: "created" });
  });

  it("returns generic success for honeypot submissions without persisting them", async () => {
    const invitation = await setupPublishedInvitation();
    await expect(submitRsvp({
      slug: invitation.slug!,
      idempotencyKey: "honeypot-one",
      clientKey: "bot-client",
      submission: { ...attendingSubmission(), honeypot: "filled" },
    })).resolves.toMatchObject({ status: "ignored" });
    await expect(db.rsvp.count({ where: { invitationId: invitation.id } })).resolves.toBe(0);
  });

  it("rejects unpublished invitations through the public route", async () => {
    const invitation = await setupPublishedInvitation();
    await db.invitation.update({ where: { id: invitation.id }, data: { status: "DRAFT" } });

    const response = await POST(
      new Request("https://undango.example/api/invitations/rsvp-invitation/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": "route-one" },
        body: JSON.stringify(attendingSubmission()),
      }),
      { params: Promise.resolve({ slug: invitation.slug! }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns generic success for honeypot requests through the public route", async () => {
    const invitation = await setupPublishedInvitation();
    const response = await POST(
      new Request("https://undango.example/api/invitations/rsvp-invitation/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": "route-bot-one" },
        body: JSON.stringify({ ...attendingSubmission(), honeypot: "filled" }),
      }),
      { params: Promise.resolve({ slug: invitation.slug! }) },
    );
    expect(response.status).toBe(201);
    await expect(db.rsvp.count({ where: { invitationId: invitation.id } })).resolves.toBe(0);
  });

  it("rate limits repeated submissions from the same invitation and client", async () => {
    const invitation = await setupPublishedInvitation();
    const makeRequest = (index: number) => POST(
      new Request("https://undango.example/api/invitations/rsvp-invitation/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `route-${index}-key`,
          "X-Forwarded-For": "198.51.100.12",
        },
        body: JSON.stringify({ name: "Guest", attendance: "NOT_ATTENDING", guestCount: 0, eventKeys: [], honeypot: "" }),
      }),
      { params: Promise.resolve({ slug: invitation.slug! }) },
    );

    const responses = [];
    for (let index = 0; index < 6; index += 1) responses.push(await makeRequest(index));
    expect(responses.slice(0, 5).map((response) => response.status)).toEqual([201, 201, 201, 201, 201]);
    expect(responses[5].status).toBe(429);
  });

  it("rejects unknown payload fields and invalid idempotency headers", async () => {
    await setupPublishedInvitation();
    const response = await POST(
      new Request("https://undango.example/api/invitations/rsvp-invitation/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": "short" },
        body: JSON.stringify({ ...attendingSubmission(), extra: true }),
      }),
      { params: Promise.resolve({ slug: "rsvp-invitation" }) },
    );
    expect(response.status).toBe(400);
  });
});
