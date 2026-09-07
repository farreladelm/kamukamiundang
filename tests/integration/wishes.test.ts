import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { workspaceDraftSchema } from "@/features/invitations/content-schema";
import { getPublicInvitationBySlug } from "@/features/invitations/public-data";
import { submitWish } from "@/features/invitations/wish";
import { POST } from "@/app/api/invitations/[slug]/wishes/route";

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "SnapshotAsset", "PublishedSnapshot", "InvitationContent", "MagicLink", "Session", "Rsvp", "Wish", "Asset", "Invitation", "Order", "Customer", "Admin", "AnalyticsEvent", "AuditEvent" CASCADE',
  );
});

async function setupPublishedInvitation({
  wishesEnabled = true,
  slug = "wish-invitation",
}: {
  wishesEnabled?: boolean;
  slug?: string;
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
      slug,
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
    secondaryEvent: null,
    wishes: { enabled: wishesEnabled, prompt: "Tinggalkan doa terbaik." },
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

function submission(message = "Semoga bahagia selalu.") {
  return { name: "Guest", message, honeypot: "" };
}

function wishRequest(idempotencyKey: string, body: unknown, cookie?: string) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
  });
  if (cookie) headers.set("Cookie", cookie);
  return new Request("https://undango.example/api/invitations/wish-invitation/wishes", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("Wish submissions", () => {
  it("creates one wish and returns the same result for an idempotent retry", async () => {
    const invitation = await setupPublishedInvitation();
    const input = {
      slug: invitation.slug!,
      idempotencyKey: "wish-request-one",
      clientKey: "wish-client-one",
      submission: submission("<strong>Semoga bahagia.</strong>"),
    };

    await expect(submitWish(input)).resolves.toMatchObject({ status: "created" });
    await expect(submitWish(input)).resolves.toMatchObject({ status: "duplicate" });
    await expect(db.wish.count({ where: { invitationId: invitation.id } })).resolves.toBe(1);
    await expect(db.wish.findFirstOrThrow({ where: { invitationId: invitation.id } })).resolves.toMatchObject({
      name: "Guest",
      message: "<strong>Semoga bahagia.</strong>",
      visibility: "VISIBLE",
      deletedAt: null,
    });
    await expect(db.analyticsEvent.findFirst({ where: { name: "wish_submitted" } })).resolves.toMatchObject({
      properties: { invitationId: invitation.id, result: "created" },
    });
  });

  it("serializes concurrent retries into one stored wish", async () => {
    const invitation = await setupPublishedInvitation({ slug: "concurrent-wishes" });
    const input = {
      slug: invitation.slug!,
      idempotencyKey: "wish-concurrent-one",
      clientKey: "wish-concurrent-client",
      submission: submission(),
    };

    const results = await Promise.all([submitWish(input), submitWish(input)]);
    expect(results.filter((result) => result.status === "created")).toHaveLength(1);
    expect(results.filter((result) => result.status === "duplicate")).toHaveLength(1);
    await expect(db.wish.count({ where: { invitationId: invitation.id } })).resolves.toBe(1);
  });

  it("keeps idempotency scoped to each invitation", async () => {
    const first = await setupPublishedInvitation({ slug: "first-wishes" });
    const second = await setupPublishedInvitation({ slug: "second-wishes" });
    const key = "wish-shared-key";

    await expect(submitWish({ slug: first.slug!, idempotencyKey: key, clientKey: "client-a", submission: submission() })).resolves.toMatchObject({ status: "created" });
    await expect(submitWish({ slug: second.slug!, idempotencyKey: key, clientKey: "client-b", submission: submission() })).resolves.toMatchObject({ status: "created" });
    await expect(db.wish.count()).resolves.toBe(2);
  });

  it("rejects unavailable invitations and disabled wish sections", async () => {
    const invitation = await setupPublishedInvitation({ wishesEnabled: false });
    await expect(submitWish({ slug: invitation.slug!, idempotencyKey: "wish-disabled", clientKey: "client-disabled", submission: submission() })).rejects.toMatchObject({ code: "unavailable" });

    await db.invitation.update({ where: { id: invitation.id }, data: { status: "DRAFT" } });
    await expect(submitWish({ slug: invitation.slug!, idempotencyKey: "wish-draft-one", clientKey: "client-draft", submission: submission() })).rejects.toMatchObject({ code: "not_found" });
  });

  it("ignores honeypot submissions without persistence", async () => {
    const invitation = await setupPublishedInvitation();
    await expect(submitWish({
      slug: invitation.slug!,
      idempotencyKey: "wish-honeypot-one",
      clientKey: "wish-bot",
      submission: { ...submission(), honeypot: "filled" },
    })).resolves.toMatchObject({ status: "ignored" });
    await expect(db.wish.count({ where: { invitationId: invitation.id } })).resolves.toBe(0);
  });

  it("returns safe route responses and enforces basic rate limiting", async () => {
    await setupPublishedInvitation();
    const invalid = await POST(wishRequest("short", { ...submission(), extra: true }), { params: Promise.resolve({ slug: "wish-invitation" }) });
    expect(invalid.status).toBe(400);

    const oversized = await POST(wishRequest("wish-oversized", { name: "Guest", message: "x".repeat(9000), honeypot: "" }), { params: Promise.resolve({ slug: "wish-invitation" }) });
    expect(oversized.status).toBe(413);

    let cookie = "";
    const responses = [];
    for (let index = 0; index < 6; index += 1) {
      const response = await POST(wishRequest(`wish-route-${index}`, submission(), cookie), { params: Promise.resolve({ slug: "wish-invitation" }) });
      const setCookie = response.headers.get("set-cookie")?.split(";", 1)[0];
      if (setCookie) cookie = setCookie;
      responses.push(response);
    }
    expect(responses.slice(0, 5).map((response) => response.status)).toEqual([201, 201, 201, 201, 201]);
    expect(responses[5].status).toBe(429);
  });

  it("returns duplicate route responses and hides non-public invitations", async () => {
    const invitation = await setupPublishedInvitation();
    const first = await POST(wishRequest("wish-route-duplicate", submission()), { params: Promise.resolve({ slug: invitation.slug! }) });
    const second = await POST(wishRequest("wish-route-duplicate", submission("Retry")), { params: Promise.resolve({ slug: invitation.slug! }) });
    expect(first.status).toBe(201);
    expect(await first.json()).toEqual({ ok: true, duplicate: false });
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ ok: true, duplicate: true });

    await db.invitation.update({ where: { id: invitation.id }, data: { status: "ARCHIVED" } });
    const unavailable = await POST(wishRequest("wish-archived-one", submission()), { params: Promise.resolve({ slug: invitation.slug! }) });
    expect(unavailable.status).toBe(404);
  });

  it("loads only latest visible non-deleted wishes with deterministic bounds", async () => {
    const invitation = await setupPublishedInvitation();
    for (let index = 0; index < 22; index += 1) {
      await db.wish.create({
        data: {
          invitationId: invitation.id,
          name: `Guest ${index}`,
          message: `Message ${index}`,
          idempotencyKey: `stored-${index}`,
          createdAt: new Date(Date.UTC(2026, 0, index + 1)),
        },
      });
    }
    await db.wish.create({
      data: {
        invitationId: invitation.id,
        name: "Hidden Guest",
        message: "Hidden",
        visibility: "HIDDEN",
        idempotencyKey: "stored-hidden",
      },
    });
    await db.wish.create({
      data: {
        invitationId: invitation.id,
        name: "Deleted Guest",
        message: "Deleted",
        idempotencyKey: "stored-deleted",
        deletedAt: new Date(),
      },
    });

    const result = await getPublicInvitationBySlug(invitation.slug!);
    expect(result?.content.wishes?.entries).toHaveLength(20);
    expect(result?.content.wishes?.entries[0]).toMatchObject({ name: "Guest 21", message: "Message 21" });
    expect(result?.content.wishes?.entries).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Hidden Guest" }),
      expect.objectContaining({ name: "Deleted Guest" }),
    ]));
  });
});
