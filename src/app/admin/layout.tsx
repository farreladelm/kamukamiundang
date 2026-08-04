import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/features/admin/admin-nav";
import { AdminToastProvider } from "@/features/admin/admin-toast";
import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/features/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const actor = await getAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!actor) redirect("/auth/admin");

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-stone-100 text-stone-900">
      <AdminNav email={actor.admin.email} />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</main>
      </div>
    </AdminToastProvider>
  );
}
