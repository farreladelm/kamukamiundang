import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
  decodeResponseCursor,
  getAdminInvitationResponses,
} from "@/features/guests/response-data";
import { moderateAdminWishAction } from "@/features/guests/response-actions";
import { ResponseManagement } from "@/features/guests/response-management";

export default async function AdminInvitationResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ invitationId: string }>;
  searchParams: Promise<{
    rsvpCursor?: string | string[];
    wishCursor?: string | string[];
  }>;
}) {
  const { invitationId } = await params;
  const idValidation = z.string().uuid().safeParse(invitationId);
  if (!idValidation.success) {
    notFound();
  }

  const { rsvpCursor: rawRsvpCursor, wishCursor: rawWishCursor } = await searchParams;

  let rsvpCursor;
  let wishCursor;
  try {
    rsvpCursor = decodeResponseCursor(rawRsvpCursor);
    wishCursor = decodeResponseCursor(rawWishCursor);
  } catch {
    notFound();
  }

  const data = await getAdminInvitationResponses({
    invitationId,
    rsvpCursor,
    wishCursor,
  });

  if (!data) {
    notFound();
  }

  const moderateWish = moderateAdminWishAction.bind(null, invitationId);

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Admin · Respons
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-4xl sm:text-5xl">{data.invitation.customerName}</h1>
          <Link
            href={`/admin/invitations/${invitationId}`}
            className="text-sm font-semibold text-stone-800 underline underline-offset-4 hover:text-stone-600"
          >
            Kembali ke invitation
          </Link>
        </div>
        <p className="text-sm text-stone-600">
          Status: {data.invitation.status} · editing: {data.invitation.editingEnabled ? "aktif" : "terkunci"}
        </p>
        {data.invitation.status === "PUBLISHED" && data.invitation.slug && (
          <div>
            <a
              href={`/i/${data.invitation.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-stone-800 underline underline-offset-4 hover:text-stone-600"
            >
              Buka invitation publik
            </a>
          </div>
        )}
      </div>

      <ResponseManagement
        action={moderateWish}
        basePath={`/admin/invitations/${invitationId}/responses`}
        currentRsvpCursor={typeof rawRsvpCursor === "string" ? rawRsvpCursor : undefined}
        currentWishCursor={typeof rawWishCursor === "string" ? rawWishCursor : undefined}
        data={data}
      />
    </section>
  );
}
