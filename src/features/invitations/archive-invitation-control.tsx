"use client";

import { useState } from "react";

export function ArchiveInvitationControl({ action }: { action: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Arsipkan
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 p-4" role="presentation">
          <div aria-labelledby="archive-invitation-title" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog">
            <h2 className="font-serif text-3xl text-stone-900" id="archive-invitation-title">Arsipkan invitation?</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">Tindakan ini tidak dapat dibatalkan. Invitation tidak lagi dapat diakses pelanggan atau publik, dan tidak dapat dipublish kembali.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800" onClick={() => setIsOpen(false)} type="button">Batalkan</button>
              <form action={action}>
                <button className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white" type="submit">Ya, arsipkan invitation</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
