import { TemplateCatalogFormList } from "@/features/admin/template-catalog-form";
import { listTemplateCatalogAdminPageData } from "@/features/templates/catalog-mutations";

export default async function AdminTemplatesPage() {
  const data = await listTemplateCatalogAdminPageData();

  return (
    <section>
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Catalog metadata</p>
      <h1 className="mt-2 font-serif text-5xl">Template</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">Admin mengelola metadata bisnis katalog. Identitas runtime, versi, renderer, capability, palette, demo, dan preview style tetap berasal dari source code.</p>
      <TemplateCatalogFormList data={data} />
    </section>
  );
}
