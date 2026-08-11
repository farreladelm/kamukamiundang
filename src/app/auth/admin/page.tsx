import { AdminLoginForm } from "@/features/auth/admin-login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }>;
}) {
  const reason = (await searchParams)?.reason;
  const initialError = reason === "session-expired" ? "Sesi admin berakhir. Silakan masuk lagi." : "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-6 py-12">
      <section className="w-full border border-stone-300 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">kamukamiundang admin</p>
        <h1 className="mt-3 font-serif text-4xl text-stone-900">Masuk dashboard</h1>
        <AdminLoginForm initialError={initialError} />
      </section>
    </main>
  );
}
