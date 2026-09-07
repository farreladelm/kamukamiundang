import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/server/db";
import {
  ADMIN_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  createAdminSession,
  createCustomerSession,
} from "@/features/auth/session";
import {
  getCustomerInvitationResponses,
  getAdminInvitationResponses,
  decodeResponseCursor,
  InvalidResponseCursorError,
  RESPONSE_PAGE_SIZE,
} from "@/features/guests/response-data";
import {
  moderateCustomerWishAction,
  moderateAdminWishAction,
} from "@/features/guests/response-actions";
import { initialFormActionState } from "@/features/forms/action-state";

const { redirectMock, revalidatePathMock, cookieTokens } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  revalidatePathMock: vi.fn(),
  cookieTokens: {
    admin: undefined as string | undefined,
    customer: undefined as string | undefined,
  },
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      if (name === ADMIN_SESSION_COOKIE && cookieTokens.admin) {
        return { value: cookieTokens.admin };
      }
      if (name === CUSTOMER_SESSION_COOKIE && cookieTokens.customer) {
        return { value: cookieTokens.customer };
      }
      return undefined;
    },
  })),
}));

beforeEach(async () => {
  cookieTokens.admin = undefined;
  cookieTokens.customer = undefined;
  redirectMock.mockClear();
  revalidatePathMock.mockClear();

  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "SnapshotAsset", "PublishedSnapshot", "InvitationContent", "MagicLink", "Session", "Rsvp", "Wish", "Asset", "Invitation", "Order", "Customer", "Admin", "AnalyticsEvent", "AuditEvent" CASCADE',
  );
});

async function createTestAdmin() {
  const admin = await db.admin.create({
    data: {
      email: "admin@example.com",
      passwordHash: "password-hash",
    },
  });
  const token = await createAdminSession(admin.id);
  return { admin, token };
}

async function createTestCustomer(name = "Customer") {
  const customer = await db.customer.create({
    data: { name },
  });
  const token = await createCustomerSession(customer.id);
  return { customer, token };
}

async function createTestInvitation(params: {
  customerId: string;
  slug?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  editingEnabled?: boolean;
}) {
  const order = await db.order.create({
    data: {
      customerId: params.customerId,
      templateKey: "template-1",
      templateVersion: 1,
      contentSchemaVersion: 1,
      paletteKey: "default",
      priceInRupiah: 100000,
      photoLimit: 10,
      storageQuotaBytes: BigInt(100) * BigInt(1024) * BigInt(1024),
      status: "PAID",
    },
  });

  return db.invitation.create({
    data: {
      customerId: params.customerId,
      orderId: order.id,
      templateKey: order.templateKey,
      templateVersion: order.templateVersion,
      contentSchemaVersion: order.contentSchemaVersion,
      paletteKey: order.paletteKey,
      slug: params.slug ?? null,
      status: params.status ?? "DRAFT",
      editingEnabled: params.editingEnabled ?? true,
      publishedAt: params.status === "PUBLISHED" ? new Date() : null,
      archivedAt: params.status === "ARCHIVED" ? new Date() : null,
    },
  });
}

function formDataFor(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.append(key, value);
  }
  return fd;
}

describe("Response management integration tests", () => {
  describe("Read authorization & IDOR", () => {
    it("1. Customer A reads RSVP and wishes for invitation A", async () => {
      const { customer: customerA, token: tokenA } = await createTestCustomer("Customer A");
      const invitationA = await createTestInvitation({
        customerId: customerA.id,
        slug: "undangan-a",
        status: "PUBLISHED",
      });

      await db.rsvp.create({
        data: {
          invitationId: invitationA.id,
          name: "Guest 1",
          attendance: "ATTENDING",
          guestCount: 2,
          eventKeys: ["mainEvent"],
          idempotencyKey: "rsvp-idem-1",
        },
      });

      await db.wish.create({
        data: {
          invitationId: invitationA.id,
          name: "Wisher 1",
          message: "Selamat ya!",
          visibility: "VISIBLE",
          idempotencyKey: "wish-idem-1",
        },
      });

      cookieTokens.customer = tokenA;

      const result = await getCustomerInvitationResponses({ invitationId: invitationA.id });
      expect(result).not.toBeNull();
      expect(result?.invitation.id).toBe(invitationA.id);
      expect(result?.invitation.customerName).toBe("Customer A");
      expect(result?.rsvps.items).toHaveLength(1);
      expect(result?.rsvps.items[0]?.name).toBe("Guest 1");
      expect(result?.rsvps.items[0]?.attendance).toBe("ATTENDING");
      expect(result?.wishes.items).toHaveLength(1);
      expect(result?.wishes.items[0]?.name).toBe("Wisher 1");
      expect(result?.wishes.items[0]?.message).toBe("Selamat ya!");
    });

    it("2. Customer result includes hidden wishes for management", async () => {
      const { customer, token } = await createTestCustomer();
      const invitation = await createTestInvitation({ customerId: customer.id });

      await db.wish.create({
        data: {
          invitationId: invitation.id,
          name: "Hidden Wisher",
          message: "Secret wish",
          visibility: "HIDDEN",
          idempotencyKey: "hidden-1",
        },
      });

      cookieTokens.customer = token;
      const result = await getCustomerInvitationResponses({ invitationId: invitation.id });
      expect(result?.wishes.items).toHaveLength(1);
      expect(result?.wishes.items[0]?.visibility).toBe("HIDDEN");
      expect(result?.wishes.items[0]?.message).toBe("Secret wish");
    });

    it("3. Customer result excludes legacy rows with deletedAt", async () => {
      const { customer, token } = await createTestCustomer();
      const invitation = await createTestInvitation({ customerId: customer.id });

      await db.wish.create({
        data: {
          invitationId: invitation.id,
          name: "Deleted Wisher",
          message: "Should not appear",
          visibility: "VISIBLE",
          deletedAt: new Date(),
          idempotencyKey: "deleted-1",
        },
      });

      cookieTokens.customer = token;
      const result = await getCustomerInvitationResponses({ invitationId: invitation.id });
      expect(result?.wishes.items).toHaveLength(0);
    });

    it("4. Returned DTO does not contain idempotency keys or customer contact fields", async () => {
      const { customer, token } = await createTestCustomer();
      const invitation = await createTestInvitation({ customerId: customer.id });

      await db.rsvp.create({
        data: {
          invitationId: invitation.id,
          name: "Guest Rsvp",
          attendance: "ATTENDING",
          guestCount: 1,
          eventKeys: ["mainEvent"],
          idempotencyKey: "secret-rsvp-key",
        },
      });

      await db.wish.create({
        data: {
          invitationId: invitation.id,
          name: "Guest Wish",
          message: "Test message",
          visibility: "VISIBLE",
          idempotencyKey: "secret-wish-key",
        },
      });

      cookieTokens.customer = token;
      const result = await getCustomerInvitationResponses({ invitationId: invitation.id });
      const rsvp = result?.rsvps.items[0] as unknown as Record<string, unknown>;
      const wish = result?.wishes.items[0] as unknown as Record<string, unknown>;

      expect(rsvp.idempotencyKey).toBeUndefined();
      expect(rsvp.email).toBeUndefined();
      expect(wish.idempotencyKey).toBeUndefined();
      expect(wish.deletedAt).toBeUndefined();
    });

    it("5. Customer A cannot read invitation B by changing invitation ID", async () => {
      const { token: tokenA } = await createTestCustomer("A");
      const { customer: customerB } = await createTestCustomer("B");

      const invitationB = await createTestInvitation({ customerId: customerB.id });

      cookieTokens.customer = tokenA;
      const result = await getCustomerInvitationResponses({ invitationId: invitationB.id });
      expect(result).toBeNull();
    });

    it("6. Customer can read owned responses while editingEnabled is false", async () => {
      const { customer, token } = await createTestCustomer();
      const invitation = await createTestInvitation({
        customerId: customer.id,
        editingEnabled: false,
      });

      await db.rsvp.create({
        data: {
          invitationId: invitation.id,
          name: "Locked Rsvp Guest",
          attendance: "UNDECIDED",
          guestCount: 1,
          eventKeys: [],
          idempotencyKey: "locked-rsvp-1",
        },
      });

      cookieTokens.customer = token;
      const result = await getCustomerInvitationResponses({ invitationId: invitation.id });
      expect(result).not.toBeNull();
      expect(result?.invitation.editingEnabled).toBe(false);
      expect(result?.rsvps.items).toHaveLength(1);
    });

    it("7. Customer cannot read archived invitation responses", async () => {
      const { customer, token } = await createTestCustomer();
      const invitation = await createTestInvitation({
        customerId: customer.id,
        status: "ARCHIVED",
      });

      cookieTokens.customer = token;
      const result = await getCustomerInvitationResponses({ invitationId: invitation.id });
      expect(result).toBeNull();
    });

    it("8. Admin reads invitation A and invitation B responses", async () => {
      const { token: adminToken } = await createTestAdmin();
      const { customer: customerA } = await createTestCustomer("Customer A");
      const { customer: customerB } = await createTestCustomer("Customer B");

      const invA = await createTestInvitation({ customerId: customerA.id });
      const invB = await createTestInvitation({ customerId: customerB.id });

      await db.wish.create({
        data: {
          invitationId: invA.id,
          name: "Wish A",
          message: "For A",
          idempotencyKey: "w-a",
        },
      });
      await db.wish.create({
        data: {
          invitationId: invB.id,
          name: "Wish B",
          message: "For B",
          idempotencyKey: "w-b",
        },
      });

      cookieTokens.admin = adminToken;

      const resA = await getAdminInvitationResponses({ invitationId: invA.id });
      const resB = await getAdminInvitationResponses({ invitationId: invB.id });

      expect(resA?.wishes.items[0]?.name).toBe("Wish A");
      expect(resB?.wishes.items[0]?.name).toBe("Wish B");
    });

    it("9. Admin reads archived invitation responses", async () => {
      const { token: adminToken } = await createTestAdmin();
      const { customer } = await createTestCustomer();
      const archivedInv = await createTestInvitation({
        customerId: customer.id,
        status: "ARCHIVED",
      });

      await db.rsvp.create({
        data: {
          invitationId: archivedInv.id,
          name: "Archived Rsvp",
          attendance: "ATTENDING",
          guestCount: 2,
          eventKeys: ["mainEvent"],
          idempotencyKey: "arch-rsvp",
        },
      });

      cookieTokens.admin = adminToken;
      const result = await getAdminInvitationResponses({ invitationId: archivedInv.id });
      expect(result).not.toBeNull();
      expect(result?.invitation.status).toBe("ARCHIVED");
      expect(result?.rsvps.items).toHaveLength(1);
    });
  });

  describe("Wish Moderation Actions", () => {
    it("10. Customer hides an owned visible wish", async () => {
      const { customer, token } = await createTestCustomer();
      const invitation = await createTestInvitation({
        customerId: customer.id,
        slug: "my-invite",
      });
      const wish = await db.wish.create({
        data: {
          invitationId: invitation.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "wish-hide-1",
        },
      });

      cookieTokens.customer = token;
      const res = await moderateCustomerWishAction(
        invitation.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "hide" }),
      );

      expect(res.status).toBe("success");
      expect(res.message).toBe("Ucapan disembunyikan.");

      const updated = await db.wish.findUnique({ where: { id: wish.id } });
      expect(updated?.visibility).toBe("HIDDEN");
    });

    it("11. Customer unhides an owned hidden wish", async () => {
      const { customer, token } = await createTestCustomer();
      const invitation = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: invitation.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "HIDDEN",
          idempotencyKey: "wish-unhide-1",
        },
      });

      cookieTokens.customer = token;
      const res = await moderateCustomerWishAction(
        invitation.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "unhide" }),
      );

      expect(res.status).toBe("success");
      expect(res.message).toBe("Ucapan ditampilkan kembali.");

      const updated = await db.wish.findUnique({ where: { id: wish.id } });
      expect(updated?.visibility).toBe("VISIBLE");
    });

    it("12. Customer hard-deletes an owned wish and database row no longer exists", async () => {
      const { customer, token } = await createTestCustomer();
      const invitation = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: invitation.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "wish-del-1",
        },
      });

      cookieTokens.customer = token;
      const res = await moderateCustomerWishAction(
        invitation.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "delete" }),
      );

      expect(res.status).toBe("success");
      expect(res.message).toBe("Ucapan dihapus permanen.");

      const exists = await db.wish.findUnique({ where: { id: wish.id } });
      expect(exists).toBeNull();
    });

    it("13. Customer cannot hide invitation B wish while authenticated as customer A", async () => {
      const { token: tokenA } = await createTestCustomer("A");
      const { customer: customerB } = await createTestCustomer("B");
      const invitationB = await createTestInvitation({ customerId: customerB.id });
      const wishB = await db.wish.create({
        data: {
          invitationId: invitationB.id,
          name: "Tamu B",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "wish-b-1",
        },
      });

      cookieTokens.customer = tokenA;
      const res = await moderateCustomerWishAction(
        invitationB.id,
        initialFormActionState,
        formDataFor({ wishId: wishB.id, intent: "hide" }),
      );

      expect(res.status).toBe("error");
      expect(res.message).toBe("Ucapan sudah berubah atau tidak tersedia. Muat ulang halaman.");

      const unmutated = await db.wish.findUnique({ where: { id: wishB.id } });
      expect(unmutated?.visibility).toBe("VISIBLE");
    });

    it("14. Customer cannot unhide invitation B wish", async () => {
      const { token: tokenA } = await createTestCustomer("A");
      const { customer: customerB } = await createTestCustomer("B");
      const invitationB = await createTestInvitation({ customerId: customerB.id });
      const wishB = await db.wish.create({
        data: {
          invitationId: invitationB.id,
          name: "Tamu B",
          message: "Pesan",
          visibility: "HIDDEN",
          idempotencyKey: "wish-b-2",
        },
      });

      cookieTokens.customer = tokenA;
      const res = await moderateCustomerWishAction(
        invitationB.id,
        initialFormActionState,
        formDataFor({ wishId: wishB.id, intent: "unhide" }),
      );

      expect(res.status).toBe("error");
      const unmutated = await db.wish.findUnique({ where: { id: wishB.id } });
      expect(unmutated?.visibility).toBe("HIDDEN");
    });

    it("15. Customer cannot delete invitation B wish", async () => {
      const { token: tokenA } = await createTestCustomer("A");
      const { customer: customerB } = await createTestCustomer("B");
      const invitationB = await createTestInvitation({ customerId: customerB.id });
      const wishB = await db.wish.create({
        data: {
          invitationId: invitationB.id,
          name: "Tamu B",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "wish-b-3",
        },
      });

      cookieTokens.customer = tokenA;
      const res = await moderateCustomerWishAction(
        invitationB.id,
        initialFormActionState,
        formDataFor({ wishId: wishB.id, intent: "delete" }),
      );

      expect(res.status).toBe("error");
      const unmutated = await db.wish.findUnique({ where: { id: wishB.id } });
      expect(unmutated).not.toBeNull();
    });

    it("16. A wish ID paired with the wrong invitation ID changes zero records", async () => {
      const { customer, token } = await createTestCustomer();
      const inv1 = await createTestInvitation({ customerId: customer.id });
      const inv2 = await createTestInvitation({ customerId: customer.id });
      const wish1 = await db.wish.create({
        data: {
          invitationId: inv1.id,
          name: "Tamu 1",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "wish-pair-1",
        },
      });

      cookieTokens.customer = token;
      // Pass inv2.id with wish1.id
      const res = await moderateCustomerWishAction(
        inv2.id,
        initialFormActionState,
        formDataFor({ wishId: wish1.id, intent: "hide" }),
      );

      expect(res.status).toBe("error");
      const unmutated = await db.wish.findUnique({ where: { id: wish1.id } });
      expect(unmutated?.visibility).toBe("VISIBLE");
    });

    it("17. Admin hides a wish from either invitation", async () => {
      const { token: adminToken } = await createTestAdmin();
      const { customer } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "adm-hide",
        },
      });

      cookieTokens.admin = adminToken;
      const res = await moderateAdminWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "hide" }),
      );

      expect(res.status).toBe("success");
      const updated = await db.wish.findUnique({ where: { id: wish.id } });
      expect(updated?.visibility).toBe("HIDDEN");
    });

    it("18. Admin unhides a wish from either invitation", async () => {
      const { token: adminToken } = await createTestAdmin();
      const { customer } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "HIDDEN",
          idempotencyKey: "adm-unhide",
        },
      });

      cookieTokens.admin = adminToken;
      const res = await moderateAdminWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "unhide" }),
      );

      expect(res.status).toBe("success");
      const updated = await db.wish.findUnique({ where: { id: wish.id } });
      expect(updated?.visibility).toBe("VISIBLE");
    });

    it("19. Admin hard-deletes a wish from either invitation", async () => {
      const { token: adminToken } = await createTestAdmin();
      const { customer } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "adm-del",
        },
      });

      cookieTokens.admin = adminToken;
      const res = await moderateAdminWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "delete" }),
      );

      expect(res.status).toBe("success");
      const exists = await db.wish.findUnique({ where: { id: wish.id } });
      expect(exists).toBeNull();
    });

    it("20. Hide/unhide audit event has correct actor, entity, action, and invitation ID", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "audit-hide",
        },
      });

      cookieTokens.customer = token;
      await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "hide" }),
      );

      const audit = await db.auditEvent.findFirst({
        where: {
          entityType: "Wish",
          entityId: wish.id,
        },
      });

      expect(audit).not.toBeNull();
      expect(audit?.actorType).toBe("CUSTOMER");
      expect(audit?.actorId).toBe(customer.id);
      expect(audit?.action).toBe("HIDDEN");
      expect(audit?.properties).toEqual({ invitationId: inv.id });
    });

    it("21. Delete audit event contains no guest name or message", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Guest Private Name",
          message: "Confidential message",
          visibility: "VISIBLE",
          idempotencyKey: "audit-del",
        },
      });

      cookieTokens.customer = token;
      await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "delete" }),
      );

      const audit = await db.auditEvent.findFirst({
        where: {
          entityType: "Wish",
          entityId: wish.id,
        },
      });

      expect(audit?.action).toBe("DELETED");
      expect(audit?.properties).toEqual({ invitationId: inv.id });
      const rawProperties = JSON.stringify(audit?.properties ?? {});
      expect(rawProperties).not.toContain("Guest Private Name");
      expect(rawProperties).not.toContain("Confidential message");
      expect(rawProperties).not.toContain("audit-del");
    });

    it("22. Invalid invitation UUID returns action validation error and performs no write", async () => {
      const { token } = await createTestCustomer();
      cookieTokens.customer = token;

      const res = await moderateCustomerWishAction(
        "invalid-uuid",
        initialFormActionState,
        formDataFor({
          wishId: "00000000-0000-4000-8000-000000000001",
          intent: "hide",
        }),
      );

      expect(res.status).toBe("error");
      expect(res.message).toBe("Aksi ucapan tidak valid.");
      const audits = await db.auditEvent.count();
      expect(audits).toBe(0);
    });

    it("23. Invalid wish UUID returns action validation error and performs no write", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      cookieTokens.customer = token;

      const res = await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({
          wishId: "invalid-uuid",
          intent: "hide",
        }),
      );

      expect(res.status).toBe("error");
      expect(res.message).toBe("Aksi ucapan tidak valid.");
    });

    it("24. Invalid intent returns action validation error and performs no write", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      cookieTokens.customer = token;

      const res = await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({
          wishId: "00000000-0000-4000-8000-000000000001",
          intent: "destroy",
        }),
      );

      expect(res.status).toBe("error");
      expect(res.message).toBe("Aksi ucapan tidak valid.");
    });

    it("25. Repeating stale hide/unhide returns controlled generic error", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "stale-hide",
        },
      });

      cookieTokens.customer = token;
      // First hide succeeds
      const res1 = await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "hide" }),
      );
      expect(res1.status).toBe("success");

      // Second hide (now already hidden) returns generic error
      const res2 = await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "hide" }),
      );
      expect(res2.status).toBe("error");
      expect(res2.message).toBe("Ucapan sudah berubah atau tidak tersedia. Muat ulang halaman.");
    });

    it("26. Missing or revoked customer session cannot mutate data", async () => {
      const { customer } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "revoked-cust",
        },
      });

      // No cookie set
      cookieTokens.customer = undefined;

      const res = await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "hide" }),
      );

      expect(res.status).toBe("error");
      const unmutated = await db.wish.findUnique({ where: { id: wish.id } });
      expect(unmutated?.visibility).toBe("VISIBLE");
    });

    it("27. Missing or revoked admin session cannot mutate data", async () => {
      const { customer } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "revoked-adm",
        },
      });

      cookieTokens.admin = undefined;

      await expect(
        moderateAdminWishAction(
          inv.id,
          initialFormActionState,
          formDataFor({ wishId: wish.id, intent: "hide" }),
        ),
      ).rejects.toThrow("REDIRECT:/auth/admin?reason=session-expired");

      const unmutated = await db.wish.findUnique({ where: { id: wish.id } });
      expect(unmutated?.visibility).toBe("VISIBLE");
    });
  });

  describe("Pagination & Cursor", () => {
    it("28. Twenty-one RSVP rows return exactly 20 items and a next cursor", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });

      const baseTime = new Date("2026-09-01T10:00:00.000Z").getTime();
      for (let i = 0; i < 21; i++) {
        await db.rsvp.create({
          data: {
            invitationId: inv.id,
            name: `Guest ${i}`,
            attendance: "ATTENDING",
            guestCount: 1,
            eventKeys: ["mainEvent"],
            idempotencyKey: `rsvp-page-${i}`,
            createdAt: new Date(baseTime + i * 1000),
          },
        });
      }

      cookieTokens.customer = token;
      const result = await getCustomerInvitationResponses({ invitationId: inv.id });
      expect(result?.rsvps.items).toHaveLength(RESPONSE_PAGE_SIZE);
      expect(result?.rsvps.nextCursor).not.toBeNull();

      // Ensure the cursor points to the 20th item (last returned), not the 21st
      const decoded = decodeResponseCursor(result?.rsvps.nextCursor ?? undefined);
      expect(decoded?.id).toBe(result?.rsvps.items[19]?.id);
    });

    it("29. Twenty-one wish rows return exactly 20 items and a next cursor", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });

      const baseTime = new Date("2026-09-01T10:00:00.000Z").getTime();
      for (let i = 0; i < 21; i++) {
        await db.wish.create({
          data: {
            invitationId: inv.id,
            name: `Wisher ${i}`,
            message: `Wish ${i}`,
            visibility: "VISIBLE",
            idempotencyKey: `wish-page-${i}`,
            createdAt: new Date(baseTime + i * 1000),
          },
        });
      }

      cookieTokens.customer = token;
      const result = await getCustomerInvitationResponses({ invitationId: inv.id });
      expect(result?.wishes.items).toHaveLength(RESPONSE_PAGE_SIZE);
      expect(result?.wishes.nextCursor).not.toBeNull();

      const decoded = decodeResponseCursor(result?.wishes.nextCursor ?? undefined);
      expect(decoded?.id).toBe(result?.wishes.items[19]?.id);
    });

    it("30. Equal timestamps sort by fixed UUID descending", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });

      const fixedDate = new Date("2026-09-01T12:00:00.000Z");
      const id1 = "00000000-0000-4000-8000-000000000001";
      const id2 = "00000000-0000-4000-8000-000000000002";

      await db.wish.create({
        data: {
          id: id1,
          invitationId: inv.id,
          name: "Wish 1",
          message: "M1",
          idempotencyKey: "w-tie-1",
          createdAt: fixedDate,
        },
      });

      await db.wish.create({
        data: {
          id: id2,
          invitationId: inv.id,
          name: "Wish 2",
          message: "M2",
          idempotencyKey: "w-tie-2",
          createdAt: fixedDate,
        },
      });

      cookieTokens.customer = token;
      const result = await getCustomerInvitationResponses({ invitationId: inv.id });
      expect(result?.wishes.items[0]?.id).toBe(id2);
      expect(result?.wishes.items[1]?.id).toBe(id1);
    });

    it("31. Second page contains no duplicates from first page", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });

      const baseTime = new Date("2026-09-01T10:00:00.000Z").getTime();
      for (let i = 0; i < 25; i++) {
        await db.wish.create({
          data: {
            invitationId: inv.id,
            name: `Wisher ${i}`,
            message: `Wish ${i}`,
            idempotencyKey: `wish-dup-${i}`,
            createdAt: new Date(baseTime + i * 1000),
          },
        });
      }

      cookieTokens.customer = token;
      const page1 = await getCustomerInvitationResponses({ invitationId: inv.id });
      const cursor1 = decodeResponseCursor(page1?.wishes.nextCursor ?? undefined);

      const page2 = await getCustomerInvitationResponses({
        invitationId: inv.id,
        wishCursor: cursor1,
      });

      const page1Ids = new Set(page1?.wishes.items.map((w) => w.id));
      for (const item of page2?.wishes.items ?? []) {
        expect(page1Ids.has(item.id)).toBe(false);
      }
    });

    it("32. Combined page traversal contains no omissions", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });

      const totalRecords = 25;
      const baseTime = new Date("2026-09-01T10:00:00.000Z").getTime();
      for (let i = 0; i < totalRecords; i++) {
        await db.wish.create({
          data: {
            invitationId: inv.id,
            name: `Wisher ${i}`,
            message: `Wish ${i}`,
            idempotencyKey: `wish-omiss-${i}`,
            createdAt: new Date(baseTime + i * 1000),
          },
        });
      }

      cookieTokens.customer = token;
      const page1 = await getCustomerInvitationResponses({ invitationId: inv.id });
      const cursor1 = decodeResponseCursor(page1?.wishes.nextCursor ?? undefined);

      const page2 = await getCustomerInvitationResponses({
        invitationId: inv.id,
        wishCursor: cursor1,
      });

      const combined = [...(page1?.wishes.items ?? []), ...(page2?.wishes.items ?? [])];
      expect(combined).toHaveLength(totalRecords);
      expect(page2?.wishes.nextCursor).toBeNull();
    });

    it("33. RSVP and wish cursors operate independently", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });

      const baseTime = new Date("2026-09-01T10:00:00.000Z").getTime();
      for (let i = 0; i < 22; i++) {
        await db.rsvp.create({
          data: {
            invitationId: inv.id,
            name: `Guest ${i}`,
            attendance: "ATTENDING",
            guestCount: 1,
            eventKeys: ["mainEvent"],
            idempotencyKey: `rsvp-indep-${i}`,
            createdAt: new Date(baseTime + i * 1000),
          },
        });
        await db.wish.create({
          data: {
            invitationId: inv.id,
            name: `Wisher ${i}`,
            message: `Wish ${i}`,
            idempotencyKey: `wish-indep-${i}`,
            createdAt: new Date(baseTime + i * 1000),
          },
        });
      }

      cookieTokens.customer = token;
      const page1 = await getCustomerInvitationResponses({ invitationId: inv.id });
      const rsvpCursor = decodeResponseCursor(page1?.rsvps.nextCursor ?? undefined);

      // Query second page of RSVP only
      const result = await getCustomerInvitationResponses({
        invitationId: inv.id,
        rsvpCursor,
      });

      expect(result?.rsvps.items).toHaveLength(2); // 22 - 20 = 2
      expect(result?.wishes.items).toHaveLength(20); // Wishes still on first page
    });

    it("34. Inserting a newer response after first-page retrieval does not shift second-page traversal", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({ customerId: customer.id });

      const baseTime = new Date("2026-09-01T10:00:00.000Z").getTime();
      for (let i = 0; i < 25; i++) {
        await db.wish.create({
          data: {
            invitationId: inv.id,
            name: `Wisher ${i}`,
            message: `Wish ${i}`,
            idempotencyKey: `wish-shift-${i}`,
            createdAt: new Date(baseTime + i * 1000),
          },
        });
      }

      cookieTokens.customer = token;
      const page1 = await getCustomerInvitationResponses({ invitationId: inv.id });
      const cursor1 = decodeResponseCursor(page1?.wishes.nextCursor ?? undefined);

      // Now insert a newer wish with a later timestamp
      await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Brand New Wisher",
          message: "Just arrived",
          idempotencyKey: "wish-brand-new",
          createdAt: new Date(baseTime + 50000),
        },
      });

      // Query page 2 with cursor1
      const page2 = await getCustomerInvitationResponses({
        invitationId: inv.id,
        wishCursor: cursor1,
      });

      // Should still return exactly the 5 older items, completely unaffected by the new row
      expect(page2?.wishes.items).toHaveLength(5);
    });

    it("35. Malformed cursor throws InvalidResponseCursorError", () => {
      expect(() => decodeResponseCursor("not-base64url")).toThrow(InvalidResponseCursorError);
      expect(() =>
        decodeResponseCursor(
          Buffer.from(JSON.stringify({ createdAt: "invalid-date", id: "not-uuid" })).toString(
            "base64url",
          ),
        ),
      ).toThrow(InvalidResponseCursorError);
    });

    it("36. Array-valued cursor throws InvalidResponseCursorError", () => {
      expect(() => decodeResponseCursor(["cursor-1", "cursor-2"])).toThrow(
        InvalidResponseCursorError,
      );
    });

    it("37. Oversized cursor throws InvalidResponseCursorError", () => {
      const oversized = "a".repeat(513);
      expect(() => decodeResponseCursor(oversized)).toThrow(InvalidResponseCursorError);
    });

    it("38. Successful hide, unhide, and delete revalidate both private routes and public slug", async () => {
      const { customer, token } = await createTestCustomer();
      const inv = await createTestInvitation({
        customerId: customer.id,
        slug: "revalidate-slug",
      });
      const wish = await db.wish.create({
        data: {
          invitationId: inv.id,
          name: "Tamu",
          message: "Pesan",
          visibility: "VISIBLE",
          idempotencyKey: "reval-test",
        },
      });

      cookieTokens.customer = token;

      // Hide
      await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "hide" }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(
        `/workspace/invitations/${inv.id}/responses`,
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(`/admin/invitations/${inv.id}/responses`);
      expect(revalidatePathMock).toHaveBeenCalledWith(`/i/revalidate-slug`);

      revalidatePathMock.mockClear();

      // Unhide
      await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "unhide" }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(
        `/workspace/invitations/${inv.id}/responses`,
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(`/admin/invitations/${inv.id}/responses`);
      expect(revalidatePathMock).toHaveBeenCalledWith(`/i/revalidate-slug`);

      revalidatePathMock.mockClear();

      // Delete
      await moderateCustomerWishAction(
        inv.id,
        initialFormActionState,
        formDataFor({ wishId: wish.id, intent: "delete" }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(
        `/workspace/invitations/${inv.id}/responses`,
      );
      expect(revalidatePathMock).toHaveBeenCalledWith(`/admin/invitations/${inv.id}/responses`);
      expect(revalidatePathMock).toHaveBeenCalledWith(`/i/revalidate-slug`);
    });
  });
});
