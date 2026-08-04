import Link from "next/link";
import { adminLogoutAction } from "@/app/auth/admin/actions";

export function AdminNav({ email }: { email: string }) {
  return (
    <header className="border-b border-stone-300 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-5 py-4 sm:px-8">
        <Link href="/admin" className="mr-auto font-serif text-2xl">Undango admin</Link>
        <nav aria-label="Navigasi admin" className="flex gap-4 text-sm font-medium">
          <Link href="/admin/templates" className="hover:text-amber-900">Template</Link>
          <Link href="/admin/orders" className="hover:text-amber-900">Order</Link>
        </nav>
        <span className="text-xs text-stone-500">{email}</span>
        <form action={adminLogoutAction}>
          <button type="submit" className="text-xs font-semibold underline underline-offset-4">Keluar</button>
        </form>
      </div>
    </header>
  );
}
