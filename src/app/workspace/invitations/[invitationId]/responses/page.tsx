import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
  decodeResponseCursor,
  getCustomerInvitationResponses,
} from "@/features/guests/response-data";
import { moderateCustomerWishAction } from "@/features/guests/response-actions";
import { ResponseManagement } from "@/features/guests/response-management";

export default async function CustomerInvitationResponsesPage({
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

  const data = await getCustomerInvitationResponses({
    invitationId,
    rsvpCursor,
    wishCursor,
  });

  if (!data) {
    notFound();
  }

  const moderateWish = moderateCustomerWishAction.bind(null, invitationId);

  return (
    <main className="mx-auto min-h-dvh max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8 space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Workspace customer
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-4xl sm:text-5xl">Kelola Respons</h1>
          {data.invitation.editingEnabled ? (
            <Link
              href={`/workspace/invitations/${invitationId}`}
              className="text-sm font-semibold text-stone-800 underline underline-offset-4 hover:text-stone-600"
            >
              Kembali ke editor
            </Link>
          ) : (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
              Akses editing terkunci
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
          <span>
            Respons untuk {data.invitation.customerName} · status: {data.invitation.status.toLowerCase()}
          </span>
          {data.invitation.slug && data.invitation.status === "PUBLISHED" && (
            <>
              <span>·</span>
              <Link
                href={`/i/${data.invitation.slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-stone-900 underline underline-offset-4 hover:text-stone-600"
              >
                Lihat undangan publik ↗
              </Link>
            </>
          )}
        </div>
      </div>

      <ResponseManagement
        action={moderateWish}
        basePath={`/workspace/invitations/${invitationId}/responses`}
        currentRsvpCursor={typeof rawRsvpCursor === "string" ? rawRsvpCursor : undefined}
        currentWishCursor={typeof rawWishCursor === "string" ? rawWishCursor : undefined}
        data={data}
      />
    </main>
  );
}
