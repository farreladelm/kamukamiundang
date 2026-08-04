"use server";

import { redirect } from "next/navigation";
import { consumeMagicLink } from "@/features/auth/magic-link";
import {
  CUSTOMER_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  clearSessionCookie,
  setSessionCookie,
} from "@/features/auth/session";

export async function consumeMagicLinkAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  if (!token) return { ok: false as const, error: "Tautan tidak valid atau sudah kedaluwarsa." };

  let result;
  try {
    result = await consumeMagicLink(token);
  } catch {
    return { ok: false as const, error: "Tautan tidak valid atau sudah kedaluwarsa." };
  }

  await clearSessionCookie(ADMIN_SESSION_COOKIE);
  await setSessionCookie(CUSTOMER_SESSION_COOKIE, result.sessionToken);
  redirect(`/workspace/invitations/${result.invitationId}`);
}
