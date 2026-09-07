"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormActionState,
  initialFormActionState,
} from "@/features/forms/action-state";
import type { ResponseManagementData } from "./response-data";

export type ResponseManagementProps = {
  data: ResponseManagementData;
  basePath: string;
  currentRsvpCursor?: string;
  currentWishCursor?: string;
  action: (
    state: FormActionState,
    formData: FormData,
  ) => Promise<FormActionState>;
};

function formatAttendance(attendance: "ATTENDING" | "NOT_ATTENDING" | "UNDECIDED"): string {
  switch (attendance) {
    case "ATTENDING":
      return "Hadir";
    case "NOT_ATTENDING":
      return "Tidak hadir";
    case "UNDECIDED":
      return "Belum memutuskan";
  }
}

function formatEventKey(key: string): string {
  if (key === "mainEvent") return "Acara utama";
  if (key === "secondaryEvent") return "Acara kedua";
  return key;
}

function formatTimestamp(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
      timeZoneName: "short",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function buildPaginationUrl(
  basePath: string,
  params: { rsvpCursor?: string; wishCursor?: string },
): string {
  const query = new URLSearchParams();
  if (params.rsvpCursor) query.set("rsvpCursor", params.rsvpCursor);
  if (params.wishCursor) query.set("wishCursor", params.wishCursor);
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function ResponseManagement({
  data,
  basePath,
  currentRsvpCursor,
  currentWishCursor,
  action,
}: ResponseManagementProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialFormActionState);
  const [confirmingDeleteWishId, setConfirmingDeleteWishId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{
    wishId: string;
    intent: "hide" | "unhide" | "delete";
  } | null>(null);
  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <div className="space-y-10">
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.message}
        </div>
      )}

      {state.status === "success" && state.message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {state.message}
        </div>
      )}

      {/* RSVP Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <h2 className="text-xl font-semibold text-stone-900">Daftar RSVP</h2>
          <span className="text-sm text-stone-500">
            Halaman {currentRsvpCursor ? "berikutnya" : "pertama"}
          </span>
        </div>

        {data.rsvps.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
            Belum ada RSVP.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.rsvps.items.map((rsvp) => (
              <div
                key={rsvp.id}
                className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-stone-900 break-words">
                      {rsvp.name}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        rsvp.attendance === "ATTENDING"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : rsvp.attendance === "NOT_ATTENDING"
                            ? "border border-rose-200 bg-rose-50 text-rose-700"
                            : "border border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {formatAttendance(rsvp.attendance)}
                    </span>
                  </div>

                  <div className="text-xs text-stone-600 space-y-1">
                    <p>
                      <span className="font-medium text-stone-700">Jumlah tamu:</span>{" "}
                      {rsvp.guestCount}
                    </p>
                    {rsvp.eventKeys.length > 0 && (
                      <div>
                        <span className="font-medium text-stone-700">Acara:</span>{" "}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rsvp.eventKeys.map((k) => (
                            <span
                              key={k}
                              className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700"
                            >
                              {formatEventKey(k)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-stone-100 pt-3 text-[11px] text-stone-400">
                  {formatTimestamp(rsvp.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RSVP Pagination */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {data.rsvps.nextCursor && (
            <Link
              href={buildPaginationUrl(basePath, {
                rsvpCursor: data.rsvps.nextCursor,
                wishCursor: currentWishCursor,
              })}
              className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Respons lebih lama
            </Link>
          )}
          {currentRsvpCursor && (
            <Link
              href={buildPaginationUrl(basePath, {
                wishCursor: currentWishCursor,
              })}
              className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Kembali ke terbaru
            </Link>
          )}
        </div>
      </section>

      {/* Wish Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <h2 className="text-xl font-semibold text-stone-900">Daftar Ucapan</h2>
          <span className="text-sm text-stone-500">
            Halaman {currentWishCursor ? "berikutnya" : "pertama"}
          </span>
        </div>

        {data.wishes.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
            Belum ada ucapan.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.wishes.items.map((wish) => {
              const isConfirmingDelete = confirmingDeleteWishId === wish.id;
              const isWishPending =
                pending && activeAction?.wishId === wish.id;

              return (
                <div
                  key={wish.id}
                  className={`flex flex-col justify-between rounded-xl border p-5 shadow-xs transition-colors ${
                    wish.visibility === "HIDDEN"
                      ? "border-stone-200 bg-stone-50/70"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-stone-900 break-words">
                        {wish.name}
                      </h3>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          wish.visibility === "VISIBLE"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-stone-300 bg-stone-200 text-stone-700"
                        }`}
                      >
                        {wish.visibility === "VISIBLE" ? "Terlihat" : "Disembunyikan"}
                      </span>
                    </div>

                    <p className="text-sm text-stone-700 whitespace-pre-line break-words">
                      {wish.message}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-stone-100 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-stone-400">
                        {formatTimestamp(wish.createdAt)}
                      </span>

                      {!isConfirmingDelete && (
                        <div className="flex flex-wrap items-center gap-2">
                          <form action={formAction}>
                            <input type="hidden" name="wishId" value={wish.id} />
                            {wish.visibility === "VISIBLE" ? (
                              <>
                                <input type="hidden" name="intent" value="hide" />
                                <button
                                  type="submit"
                                  disabled={pending}
                                  onClick={() =>
                                    setActiveAction({ wishId: wish.id, intent: "hide" })
                                  }
                                  className="inline-flex items-center rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                                >
                                  {isWishPending && activeAction?.intent === "hide"
                                    ? "Menyembunyikan..."
                                    : "Sembunyikan"}
                                </button>
                              </>
                            ) : (
                              <>
                                <input type="hidden" name="intent" value="unhide" />
                                <button
                                  type="submit"
                                  disabled={pending}
                                  onClick={() =>
                                    setActiveAction({ wishId: wish.id, intent: "unhide" })
                                  }
                                  className="inline-flex items-center rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                                >
                                  {isWishPending && activeAction?.intent === "unhide"
                                    ? "Menampilkan..."
                                    : "Tampilkan kembali"}
                                </button>
                              </>
                            )}
                          </form>

                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setConfirmingDeleteWishId(wish.id)}
                            className="inline-flex items-center rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>

                    {isConfirmingDelete && (
                      <div
                        role="region"
                        aria-label="Konfirmasi hapus ucapan"
                        className="mt-3 rounded-lg border border-red-200 bg-red-50/80 p-3 space-y-2 text-xs"
                      >
                        <p className="font-semibold text-red-900">Hapus ucapan ini?</p>
                        <p className="text-red-700">
                          Ucapan akan dihapus permanen dan tidak dapat dipulihkan.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setConfirmingDeleteWishId(null)}
                            className="inline-flex items-center rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                          >
                            Batal
                          </button>
                          <form action={formAction}>
                            <input type="hidden" name="wishId" value={wish.id} />
                            <input type="hidden" name="intent" value="delete" />
                            <button
                              type="submit"
                              disabled={pending}
                              onClick={() => {
                                setConfirmingDeleteWishId(null);
                                setActiveAction({ wishId: wish.id, intent: "delete" });
                              }}
                              className="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {isWishPending && activeAction?.intent === "delete"
                                ? "Menghapus..."
                                : "Ya, hapus permanen"}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Wish Pagination */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {data.wishes.nextCursor && (
            <Link
              href={buildPaginationUrl(basePath, {
                rsvpCursor: currentRsvpCursor,
                wishCursor: data.wishes.nextCursor,
              })}
              className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Respons lebih lama
            </Link>
          )}
          {currentWishCursor && (
            <Link
              href={buildPaginationUrl(basePath, {
                rsvpCursor: currentRsvpCursor,
              })}
              className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Kembali ke terbaru
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
