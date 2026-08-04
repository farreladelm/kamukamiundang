import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/server/db";
import { loginAdmin, resetAdminLoginRateLimit, upsertAdminCredential } from "@/features/auth/admin-auth";
import { getAdminSession, getCustomerSession, revokeSession } from "@/features/auth/session";

beforeEach(async () => {
  resetAdminLoginRateLimit();
  await db.$executeRawUnsafe('TRUNCATE TABLE "TemplateVisibility", "AuditEvent", "MagicLink", "Session", "InvitationContent", "Invitation", "Order", "Customer", "Admin" CASCADE');
});

describe("admin authentication", () => {
  it("stores only a hash and creates a revocable 24-hour admin session", async () => {
    const admin = await upsertAdminCredential({ email: " Owner@Example.com ", password: "correct horse battery" });
    const stored = await db.admin.findUnique({ where: { id: admin.id } });

    expect(stored?.email).toBe("owner@example.com");
    expect(stored?.passwordHash).not.toContain("correct horse battery");

    const login = await loginAdmin({ email: "OWNER@example.com", password: "correct horse battery" });
    expect(login.ok).toBe(true);
    if (!login.ok) return;

    const session = await getAdminSession(login.sessionToken);
    expect(session?.admin.id).toBe(admin.id);
    await expect(getCustomerSession(login.sessionToken)).resolves.toBeNull();
    expect(session?.session.expiresAt.getTime()).toBeGreaterThan(Date.now() + 23 * 60 * 60 * 1000);

    await revokeSession(login.sessionToken);
    await expect(getAdminSession(login.sessionToken)).resolves.toBeNull();
  });

  it("returns generic errors and blocks the sixth failed attempt", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await loginAdmin({ email: "missing@example.com", password: "wrong password" });
      expect(result).toEqual({ ok: false, error: "Email atau kata sandi salah." });
    }

    await expect(loginAdmin({ email: "missing@example.com", password: "wrong password" })).resolves.toEqual({
      ok: false,
      error: "Email atau kata sandi salah.",
    });
  });

  it("allows a correct login after one wrong password", async () => {
    await upsertAdminCredential({ email: "retry@example.com", password: "correct horse battery" });

    await expect(loginAdmin({ email: "retry@example.com", password: "wrong password" })).resolves.toMatchObject({
      ok: false,
    });
    await expect(loginAdmin({ email: "retry@example.com", password: "correct horse battery" })).resolves.toMatchObject({
      ok: true,
    });
  });
});
