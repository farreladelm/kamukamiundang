import "server-only";

import { db } from "@/lib/server/db";
import {
  ADMIN_LOGIN_ERROR,
  hashAdminPassword,
  normalizeAdminEmail,
  verifyAdminPassword,
} from "./password";
import { createAdminSession } from "./session";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$xjJODDiMWpoZDUU2cXvpIQ$YiCm/TGEDTK0DzDAatM7Jfwv/eZZa7z/r2WfWlWKqKA";

type LoginAttempt = { failures: number; firstFailureAt: number };
const loginAttempts = new Map<string, LoginAttempt>();

function loginKey(email: string): string {
  return email;
}

function isRateLimited(key: string, now: number): boolean {
  const attempt = loginAttempts.get(key);

  if (!attempt) return false;
  if (now - attempt.firstFailureAt >= LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }

  return attempt.failures >= MAX_LOGIN_FAILURES;
}

function recordFailure(key: string, now: number): void {
  const current = loginAttempts.get(key);

  if (!current || now - current.firstFailureAt >= LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { failures: 1, firstFailureAt: now });
    return;
  }

  current.failures += 1;
}

function pruneExpiredAttempts(now: number): void {
  for (const [key, attempt] of loginAttempts) {
    if (now - attempt.firstFailureAt >= LOGIN_WINDOW_MS) loginAttempts.delete(key);
  }
}

export function resetAdminLoginRateLimit(): void {
  loginAttempts.clear();
}

export async function loginAdmin({
  email,
  password,
  now = new Date(),
}: {
  email: string;
  password: string;
  now?: Date;
}): Promise<{ ok: true; adminId: string; sessionToken: string } | { ok: false; error: string }> {
  let normalizedEmail: string;

  try {
    normalizedEmail = normalizeAdminEmail(email);
  } catch {
    normalizedEmail = email.trim().toLowerCase();
  }

  const key = loginKey(normalizedEmail);
  const currentTime = now.getTime();

  pruneExpiredAttempts(currentTime);
  if (isRateLimited(key, currentTime)) {
    return { ok: false, error: ADMIN_LOGIN_ERROR };
  }

  // Reserve failure slot before expensive password verification so concurrent attempts cannot bypass the limit.
  recordFailure(key, currentTime);

  const admin = await db.admin.findUnique({ where: { email: normalizedEmail } });
  const passwordMatches = await verifyAdminPassword(
    admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
    password,
  );

  if (!admin || !admin.isActive || !passwordMatches) {
    return { ok: false, error: ADMIN_LOGIN_ERROR };
  }

  loginAttempts.delete(key);
  return {
    ok: true,
    adminId: admin.id,
    sessionToken: await createAdminSession(admin.id, now),
  };
}

export async function upsertAdminCredential({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const normalizedEmail = normalizeAdminEmail(email);
  const passwordHash = await hashAdminPassword(password);

  return db.$transaction(async (tx) => {
    const admin = await tx.admin.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, passwordHash, isActive: true },
      update: { passwordHash, isActive: true },
      select: { id: true, email: true, isActive: true },
    });

    await tx.session.updateMany({
      where: { adminId: admin.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return admin;
  });
}
