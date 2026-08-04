"use server";

import { headers } from "next/headers";
import { requireAdmin } from "@/features/auth/policies";
import { issueMagicLink } from "@/features/auth/magic-link";
import { getApplicationOrigin } from "@/lib/server/env";

export type MagicLinkIssueResult = { url?: string; error?: string };

export async function issueInvitationMagicLinkAction(
  invitationId: string,
): Promise<MagicLinkIssueResult> {
  const { admin } = await requireAdmin();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  try {
    const result = await issueMagicLink({
      invitationId,
      adminId: admin.id,
      origin: getApplicationOrigin(`${protocol}://${host}`),
    });
    return { url: result.url };
  } catch {
    return { error: "Invitation tidak tersedia untuk link baru." };
  }
}
