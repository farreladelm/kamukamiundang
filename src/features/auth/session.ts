import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";

export const ADMIN_SESSION_COOKIE = "undango_admin_session";
export const CUSTOMER_SESSION_COOKIE = "undango_customer_session";
export const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const SESSION_TTL_MS = ADMIN_SESSION_TTL_MS;
export const CUSTOMER_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const CUSTOMER_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookieOptions(cookieName?: string) {
  const maxAge =
    cookieName === CUSTOMER_SESSION_COOKIE
      ? CUSTOMER_COOKIE_MAX_AGE_SECONDS
      : SESSION_TTL_MS / 1000;

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createAdminSession(adminId: string, now = new Date()) {
  const token = createOpaqueToken();

  await db.session.create({
    data: {
      tokenHash: hashOpaqueToken(token),
      actorType: "ADMIN",
      adminId,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    },
  });

  return token;
}

export async function createCustomerSession(customerId: string, now = new Date()) {
  const token = createOpaqueToken();

  await db.session.create({
    data: {
      tokenHash: hashOpaqueToken(token),
      actorType: "CUSTOMER",
      customerId,
      expiresAt: new Date(now.getTime() + CUSTOMER_SESSION_TTL_MS),
    },
  });

  return token;
}

export async function getAdminSession(token: string | undefined, now = new Date()) {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    include: { admin: true },
  });

  if (
    !session ||
    session.actorType !== "ADMIN" ||
    !session.admin?.isActive ||
    session.revokedAt ||
    session.expiresAt <= now
  ) {
    return null;
  }

  await db.session.update({
    where: { id: session.id },
    data: { lastUsedAt: now },
  });

  return { session, admin: session.admin };
}

export async function getCustomerSession(token: string | undefined, now = new Date()) {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    include: { customer: true },
  });

  if (
    !session ||
    session.actorType !== "CUSTOMER" ||
    !session.customer ||
    session.revokedAt ||
    session.expiresAt <= now
  ) {
    return null;
  }

  const nextExpiresAt = new Date(now.getTime() + CUSTOMER_SESSION_TTL_MS);

  await db.session.update({
    where: { id: session.id },
    data: {
      lastUsedAt: now,
      expiresAt: nextExpiresAt,
    },
  });

  return { session: { ...session, expiresAt: nextExpiresAt }, customer: session.customer };
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;

  await db.session.updateMany({
    where: { tokenHash: hashOpaqueToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function setSessionCookie(
  cookieName: string,
  token: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, sessionCookieOptions(cookieName));
}

export async function clearSessionCookie(cookieName: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", { ...sessionCookieOptions(cookieName), maxAge: 0 });
}
