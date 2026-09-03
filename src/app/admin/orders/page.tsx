import Link from "next/link";
import { db } from "@/lib/server/db";
import { OrderActions } from "@/features/orders/order-actions";

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, invitation: true },
  });

  return (
    <section>
      <div className="flex flex-wrap items-end gap-4">
        <div className="mr-auto"><p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Order manual</p><h1 className="mt-2 font-serif text-5xl">Order</h1></div>
        <Link href="/admin/orders/new" className="bg-stone-900 px-4 py-3 text-sm font-semibold text-white">Catat order</Link>
      </div>
      <div className="mt-8 overflow-x-auto border border-stone-300 bg-white">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="border-b border-stone-300 bg-stone-50 text-xs uppercase"><tr><th className="p-4">Customer</th><th className="p-4">Template</th><th className="p-4">Status</th><th className="p-4">Aksi</th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id} className="border-b border-stone-200 last:border-0"><td className="p-4">{order.customer.name}</td><td className="p-4">{order.templateKey} v{order.templateVersion}</td><td className="p-4">{order.status}</td><td className="p-4"><OrderActions orderId={order.id} status={order.status} invitationId={order.invitation?.id ?? null} /></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
