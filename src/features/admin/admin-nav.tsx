"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogoutAction } from "@/app/auth/admin/actions";

const navItems = [
  { href: "/admin/templates", label: "Template" },
  { href: "/admin/orders", label: "Order" },
  { href: "/admin/music", label: "Musik" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-stone-300 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-5 px-5 py-4 sm:px-8">
        <Link href="/admin" className="mr-auto font-serif text-2xl">kamukamiundang admin</Link>
        <nav aria-label="Navigasi admin" className="flex gap-4 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "text-amber-900 underline underline-offset-4" : "hover:text-amber-900"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="text-xs text-stone-500">{email}</span>
        <form action={adminLogoutAction}>
          <button type="submit" className="text-xs font-semibold underline underline-offset-4">Keluar</button>
        </form>
      </div>
    </header>
  );
}
