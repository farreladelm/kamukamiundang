import { templateRegistry } from "@/features/templates/registry";
import { OrderForm } from "@/features/orders/order-form";

export default function NewOrderPage() {
  const templateSelections = templateRegistry.flatMap((template) =>
    template.palettes.map((palette) => ({
      value: `${template.templateKey}|${template.templateVersion}|${palette.key}`,
      label: `${template.name} · ${palette.name}`,
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
