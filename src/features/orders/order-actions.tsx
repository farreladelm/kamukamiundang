"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  activateOrderAction,
  markOrderPaidAction,
} from "@/app/admin/orders/actions";

type OrderStatus = "PENDING" | "PAID" | "ACTIVATED" | "CANCELLED" | "REFUNDED";

export function OrderActions({
  orderId,
  status,
  invitationId,
}: {
  orderId: string;
  status: OrderStatus;
  invitationId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runAction(action: (id: string) => Promise<unknown>) {
    startTransition(async () => {
      setError(null);
      try {
        await action(orderId);
        router.refresh();
      } catch {
        setError("Aksi order tidak berhasil. Muat ulang halaman dan coba lagi.");
      }
    });
  }

  if (status === "PENDING") {
    return (
      <div className="grid gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => runAction(markOrderPaidAction)}
          className="text-left underline disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Memproses..." : "Tandai paid"}
        </button>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      </div>
    );
  }

  if (status === "PAID") {
    return (
      <div className="grid gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => runAction(activateOrderAction)}
          className="text-left underline disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Memproses..." : "Aktifkan"}
        </button>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      </div>
    );
  }

  if (status === "ACTIVATED" && invitationId) {
    return <Link href={`/admin/invitations/${invitationId}`} className="underline">Invitation</Link>;
  }

  return <span className="text-stone-400">-</span>;
}
