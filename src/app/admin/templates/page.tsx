import { listTemplateVisibility } from "@/features/templates/visibility";
import { TemplateVisibilityList } from "@/features/admin/template-visibility-list";

export default async function AdminTemplatesPage() {
  const templates = await listTemplateVisibility();

  return (
    <section>
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Catalog metadata</p>
      <h1 className="mt-2 font-serif text-5xl">Template</h1>
      <p className="mt-4 text-sm leading-6 text-stone-600">Admin hanya mengubah visibilitas. Harga katalog dibaca dari database; desain, versi, dan palette tetap berasal dari source code.</p>
      <TemplateVisibilityList templates={templates} />
    </section>
  );
}
