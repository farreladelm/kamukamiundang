import { getVisibleTemplateCatalog } from "@/features/templates/catalog";
import { OrderForm } from "@/features/orders/order-form";

function formatRupiah(priceInRupiah: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(priceInRupiah);
}

export default async function NewOrderPage() {
  const templates = await getVisibleTemplateCatalog();
  const templateSelections = templates.flatMap((template) =>
    template.palettes.map((palette) => ({
      value: `${template.templateKey}|${template.templateVersion}|${palette.key}`,
      label: `${template.name} · ${palette.name} (${formatRupiah(template.priceInRupiah)})`,
    })),
  );

  return (
    <section className="mx-auto max-w-2xl">
      <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Order manual</p>
      <h1 className="mt-2 font-serif text-5xl">Catat order baru</h1>
      <OrderForm selections={templateSelections} />
    </section>
  );
}
