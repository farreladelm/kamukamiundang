export default function AdminDashboardPage() {
  return (
    <section>
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Operasional</p>
      <h1 className="mt-2 font-serif text-5xl">Dashboard</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
        Kelola visibilitas template, catat order manual, aktifkan workspace, dan kirim akses customer.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a href="/admin/templates" className="border border-stone-300 bg-white p-5 font-semibold hover:border-stone-900">Kelola template</a>
        <a href="/admin/orders" className="border border-stone-300 bg-white p-5 font-semibold hover:border-stone-900">Kelola order</a>
      </div>
    </section>
  );
}
