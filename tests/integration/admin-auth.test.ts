import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { loginAdmin, resetAdminLoginRateLimit, upsertAdminCredential } from "@/features/auth/admin-auth";
import {
  createAdminSession,
  createCustomerSession,
  getAdminSession,
  getCustomerSession,
  hashOpaqueToken,
  revokeSession,
  SESSION_TTL_MS,
} from "@/features/auth/session";

const LOGIN_ERROR = "Email atau kata sandi salah.";

beforeEach(async () => {
  resetAdminLoginRateLimit();
  await db.$executeRawUnsafe('TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer", "Admin" CASCADE');
});

describe("admin authentication", () => {
  it("creates a hashed, admin-scoped session with a 24-hour lifetime", async () => {
    const now = new Date("2026-08-17T10:00:00.000Z");
    const admin = await upsertAdminCredential({ email: " Owner@Example.com ", password: "correct horse battery" });

    const stored = await db.admin.findUnique({ where: { id: admin.id } });
    expect(stored?.email).toBe("owner@example.com");
    expect(stored?.passwordHash).not.toContain("correct horse battery");

    const login = await loginAdmin({ email: "OWNER@example.com", password: "correct horse battery", now });
    expect(login).toMatchObject({ ok: true, adminId: admin.id });
    if (!login.ok) return;

    const storedSession = await db.session.findUnique({ where: { tokenHash: hashOpaqueToken(login.sessionToken) } });
    expect(storedSession).toMatchObject({ actorType: "ADMIN", adminId: admin.id, customerId: null });
    expect(storedSession?.tokenHash).not.toContain(login.sessionToken);
    expect(storedSession?.expiresAt).toEqual(new Date(now.getTime() + SESSION_TTL_MS));

    await expect(getAdminSession(login.sessionToken, now)).resolves.toMatchObject({ admin: { id: admin.id } });
    await expect(getCustomerSession(login.sessionToken, now)).resolves.toBeNull();
  });

  it("uses one generic failure for unknown, wrong-password, and inactive accounts", async () => {
    await upsertAdminCredential({ email: "active@example.com", password: "correct horse battery" });
    const inactive = await upsertAdminCredential({ email: "inactive@example.com", password: "correct horse battery" });
    await db.admin.update({ where: { id: inactive.id }, data: { isActive: false } });

    const unknown = await loginAdmin({ email: "missing@example.com", password: "wrong password" });
    const wrongPassword = await loginAdmin({ email: "active@example.com", password: "wrong password" });
    const inactiveLogin = await loginAdmin({ email: "inactive@example.com", password: "correct horse battery" });

    expect(unknown).toEqual({ ok: false, error: LOGIN_ERROR });
    expect(wrongPassword).toEqual(unknown);
    expect(inactiveLogin).toEqual(unknown);
    await expect(db.session.count()).resolves.toBe(0);
  });

  it("blocks the sixth failure and allows login after the fifteen-minute window", async () => {
    const now = new Date("2026-08-17T10:00:00.000Z");
    await upsertAdminCredential({ email: "owner@example.com", password: "correct horse battery" });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(loginAdmin({ email: "owner@example.com", password: "wrong password", now })).resolves.toEqual({
        ok: false,
        error: LOGIN_ERROR,
      });
    }

    await expect(loginAdmin({ email: "owner@example.com", password: "correct horse battery", now })).resolves.toEqual({
      ok: false,
      error: LOGIN_ERROR,
    });

    await expect(loginAdmin({
      email: "owner@example.com",
      password: "correct horse battery",
      now: new Date(now.getTime() + 15 * 60 * 1000),
    })).resolves.toMatchObject({ ok: true });
  });

  it("clears failure count after a successful login", async () => {
    const now = new Date("2026-08-17T10:00:00.000Z");
    await upsertAdminCredential({ email: "owner@example.com", password: "correct horse battery" });

    await expect(loginAdmin({ email: "owner@example.com", password: "wrong password", now })).resolves.toMatchObject({ ok: false });
    await expect(loginAdmin({ email: "owner@example.com", password: "correct horse battery", now })).resolves.toMatchObject({ ok: true });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(loginAdmin({ email: "owner@example.com", password: "wrong password", now })).resolves.toMatchObject({ ok: false });
    }
    await expect(loginAdmin({ email: "owner@example.com", password: "correct horse battery", now })).resolves.toMatchObject({ ok: true });
  });

  it("revokes existing sessions when credentials are rotated", async () => {
    const now = new Date("2026-08-17T10:00:00.000Z");
    const admin = await upsertAdminCredential({ email: "owner@example.com", password: "old horse battery" });
    const firstLogin = await loginAdmin({ email: "owner@example.com", password: "old horse battery", now });
    expect(firstLogin.ok).toBe(true);
    if (!firstLogin.ok) return;

    await upsertAdminCredential({ email: "OWNER@example.com", password: "new horse battery" });

    await expect(getAdminSession(firstLogin.sessionToken, now)).resolves.toBeNull();
    await expect(loginAdmin({ email: "owner@example.com", password: "old horse battery", now })).resolves.toEqual({
      ok: false,
      error: LOGIN_ERROR,
    });
    await expect(loginAdmin({ email: "owner@example.com", password: "new horse battery", now })).resolves.toMatchObject({
      ok: true,
      adminId: admin.id,
    });
  });

  it("rejects expired, revoked, inactive, and customer-scoped sessions", async () => {
    const now = new Date("2026-08-17T10:00:00.000Z");
    const admin = await upsertAdminCredential({ email: "owner@example.com", password: "correct horse battery" });

    const expiredToken = await createAdminSession(admin.id, new Date(now.getTime() - SESSION_TTL_MS));
    const revokedToken = await createAdminSession(admin.id, now);
    await revokeSession(revokedToken);
    const inactiveToken = await createAdminSession(admin.id, now);
    await db.admin.update({ where: { id: admin.id }, data: { isActive: false } });
    const customer = await db.customer.create({ data: { name: "Customer" } });
    const customerToken = await createCustomerSession(customer.id, now);

    await expect(getAdminSession(expiredToken, now)).resolves.toBeNull();
    await expect(getAdminSession(revokedToken, now)).resolves.toBeNull();
    await expect(getAdminSession(inactiveToken, now)).resolves.toBeNull();
    await expect(getAdminSession(customerToken, now)).resolves.toBeNull();
  });
});
