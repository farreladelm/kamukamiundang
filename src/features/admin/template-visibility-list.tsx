"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setTemplateVisibilityAction } from "@/app/admin/templates/actions";
import { useAdminToast } from "./admin-toast";
import {
  initialFormActionState,
  type FormActionState,
} from "@/features/forms/action-state";

type TemplateVisibilityItem = {
  templateKey: string;
  templateVersion: number;
  name: string;
  category: string;
  priceInRupiah: number;
  isVisible: boolean;
};

function VisibilityRow({ template }: { template: TemplateVisibilityItem }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    setTemplateVisibilityAction,
    initialFormActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      showToast(state.message);
      router.refresh();
    }
    if (state.status === "error") showToast(state.message, "error");
  }, [router, showToast, state.message, state.status]);

  return (
    <article className="flex flex-wrap items-center gap-4 border border-stone-300 bg-white p-5">
      <div className="mr-auto">
        <h2 className="font-serif text-2xl">{template.name}</h2>
        <p className="mt-1 text-xs text-stone-500">{template.templateKey} v{template.templateVersion} · {template.category} · Rp {template.priceInRupiah.toLocaleString("id-ID")}</p>
        <p className="mt-2 text-xs font-semibold text-stone-600" role="status">{template.isVisible ? "Tampil di katalog" : "Tersembunyi dari katalog"}</p>
      </div>
      <form action={formAction}>
        <input type="hidden" name="templateKey" value={template.templateKey} />
        <input type="hidden" name="templateVersion" value={template.templateVersion} />
        <input type="hidden" name="isVisible" value={String(!template.isVisible)} />
        <button type="submit" disabled={pending} className="border border-stone-900 px-4 py-2 text-sm font-semibold hover:bg-stone-900 hover:text-white disabled:cursor-wait disabled:opacity-50">
          {pending ? "Menyimpan..." : template.isVisible ? "Sembunyikan" : "Tampilkan"}
        </button>
      </form>
    </article>
  );
}

export function TemplateVisibilityList({ templates }: { templates: TemplateVisibilityItem[] }) {
  return <div className="mt-8 grid gap-4">{templates.map((template) => <VisibilityRow key={`${template.templateKey}-${template.templateVersion}`} template={template} />)}</div>;
}
