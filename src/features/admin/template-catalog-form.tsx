"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTemplateCatalogAction } from "@/app/admin/templates/actions";
import {
  initialFormActionState,
  type FormActionState,
} from "@/features/forms/action-state";
import { useAdminToast } from "./admin-toast";
import type { listTemplateCatalogAdminPageData } from "@/features/templates/catalog-mutations";

type AdminPageData = Awaited<ReturnType<typeof listTemplateCatalogAdminPageData>>;
type AdminTemplateCatalog = AdminPageData["catalogs"][number];
type AdminCategory = AdminPageData["categories"][number];

const statuses = ["DRAFT", "VISIBLE", "HIDDEN", "RETIRED"] as const;

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return <p id={`${id}-error`} className="mt-1 text-xs text-red-700" role="alert">{messages[0]}</p>;
}

function describedBy(id: string, messages?: string[]): string | undefined {
  return messages?.length ? `${id}-error` : undefined;
}

function RuntimeDetails({ template }: { template: AdminTemplateCatalog }) {
  const runtime = template.runtime;

  return (
    <details className="border-t border-stone-200 pt-4">
      <summary className="cursor-pointer text-sm font-semibold text-stone-700">Runtime read-only</summary>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Template key</dt>
          <dd className="mt-1 font-mono text-xs">{template.templateKey}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Template version</dt>
          <dd className="mt-1 font-mono text-xs">{template.templateVersion}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Schema version</dt>
          <dd className="mt-1 font-mono text-xs">{runtime?.contentSchemaVersion ?? "Runtime tidak tersedia"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Renderer</dt>
          <dd className="mt-1 font-mono text-xs">{runtime?.renderer ?? "Runtime tidak tersedia"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Preview style</dt>
          <dd className="mt-1 font-mono text-xs">{runtime?.previewStyle ?? "Runtime tidak tersedia"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Capabilities</dt>
          <dd className="mt-1 text-xs">{runtime?.capabilities.join(", ") || "Runtime tidak tersedia"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Palettes</dt>
          <dd className="mt-1 text-xs">{runtime?.palettes.map((palette) => `${palette.key} (${palette.name})`).join(", ") || "Runtime tidak tersedia"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Demo</dt>
          <dd className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap bg-stone-50 p-3 font-mono text-[11px] leading-5">
            {runtime ? JSON.stringify(runtime.demo, null, 2) : "Runtime tidak tersedia"}
          </dd>
        </div>
      </dl>
    </details>
  );
}

function TemplateCatalogForm({ template, categories }: { template: AdminTemplateCatalog; categories: AdminCategory[] }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    updateTemplateCatalogAction,
    initialFormActionState,
  );
  const currentCategoryIsSelectable = categories.some((category) => category.id === template.categoryId);
  const categoryOptions = currentCategoryIsSelectable
    ? categories
    : [{ id: template.categoryId, key: template.category.key, name: `${template.category.name} (nonaktif, historis)` }, ...categories];

  useEffect(() => {
    if (state.status === "success") {
      showToast(state.message);
      router.refresh();
    }
    if (state.status === "error") showToast(state.message, "error");
  }, [router, showToast, state.message, state.status]);

  const error = (name: string) => state.fieldErrors[name];
  const fieldId = (name: string) => `${template.id}-${name}`;
  const inputProps = (name: string) => ({
    "aria-invalid": Boolean(error(name)?.length),
    "aria-describedby": describedBy(fieldId(name), error(name)),
  });

  return (
    <article className="border border-stone-300 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
        <div className="mr-auto">
          <h2 className="font-serif text-3xl">{template.name}</h2>
          <p className="mt-1 text-xs text-stone-500">{template.templateKey} v{template.templateVersion} · {template.category.name} · {template.status}</p>
        </div>
        <span className="border border-stone-300 px-3 py-1 text-xs font-semibold tracking-wide text-stone-600 uppercase">{template.slug}</span>
      </div>

      <form action={formAction} className="mt-7 grid gap-5 lg:grid-cols-2">
        <input type="hidden" name="catalogId" value={template.id} />
        <div>
          <label htmlFor={`${template.id}-name`} className="text-sm font-semibold">Nama</label>
          <input id={`${template.id}-name`} name="name" defaultValue={template.name} required className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm" {...inputProps("name")} />
          <FieldError id={fieldId("name")} messages={error("name")} />
        </div>
        <div>
          <label htmlFor={`${template.id}-slug`} className="text-sm font-semibold">Slug</label>
          <input id={`${template.id}-slug`} name="slug" defaultValue={template.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-sm" {...inputProps("slug")} />
          <FieldError id={fieldId("slug")} messages={error("slug")} />
        </div>
        <div className="lg:col-span-2">
          <label htmlFor={`${template.id}-description`} className="text-sm font-semibold">Deskripsi</label>
          <textarea id={`${template.id}-description`} name="description" defaultValue={template.description} required rows={3} className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm leading-6" {...inputProps("description")} />
          <FieldError id={fieldId("description")} messages={error("description")} />
        </div>
        <div>
          <label htmlFor={`${template.id}-price`} className="text-sm font-semibold">Harga (Rupiah)</label>
          <input id={`${template.id}-price`} name="priceInRupiah" type="number" min="0" step="1" defaultValue={template.priceInRupiah} required className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm" {...inputProps("priceInRupiah")} />
          <FieldError id={fieldId("priceInRupiah")} messages={error("priceInRupiah")} />
        </div>
        <div>
          <label htmlFor={`${template.id}-order`} className="text-sm font-semibold">Urutan tampil</label>
          <input id={`${template.id}-order`} name="displayOrder" type="number" min="0" step="1" defaultValue={template.displayOrder} required className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm" {...inputProps("displayOrder")} />
          <FieldError id={fieldId("displayOrder")} messages={error("displayOrder")} />
        </div>
        <div>
          <label htmlFor={`${template.id}-category`} className="text-sm font-semibold">Kategori</label>
          <select id={`${template.id}-category`} name="categoryId" defaultValue={template.categoryId} required className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm" {...inputProps("categoryId")}>
            {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <FieldError id={fieldId("categoryId")} messages={error("categoryId")} />
        </div>
        <div>
          <label htmlFor={`${template.id}-status`} className="text-sm font-semibold">Status lifecycle</label>
          <select id={`${template.id}-status`} name="status" defaultValue={template.status} disabled={template.status === "RETIRED"} className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" {...inputProps("status")}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          {template.status === "RETIRED" && <input type="hidden" name="status" value="RETIRED" />}
          <FieldError id={fieldId("status")} messages={error("status")} />
        </div>
        <div className="lg:col-span-2">
          <label htmlFor={`${template.id}-thumbnail`} className="text-sm font-semibold">Marketing thumbnail URL</label>
          <input id={`${template.id}-thumbnail`} name="marketingThumbnail" type="url" defaultValue={template.marketingThumbnail ?? ""} placeholder="https://..." className="mt-2 w-full border border-stone-300 bg-stone-50 px-3 py-2 text-sm" {...inputProps("marketingThumbnail")} />
          <FieldError id={fieldId("marketingThumbnail")} messages={error("marketingThumbnail")} />
        </div>
        {state.formErrors.length > 0 && <p className="lg:col-span-2 text-sm text-red-700" role="alert">{state.formErrors[0]}</p>}
        <div className="lg:col-span-2 flex items-center justify-between gap-4 border-t border-stone-200 pt-5">
          <p className="text-xs leading-5 text-stone-500">Field runtime di bawah berasal dari source code dan tidak dapat diubah admin.</p>
          <button type="submit" disabled={pending} className="shrink-0 border border-stone-900 px-4 py-2 text-sm font-semibold hover:bg-stone-900 hover:text-white disabled:cursor-wait disabled:opacity-50">{pending ? "Menyimpan..." : "Simpan metadata"}</button>
        </div>
      </form>
      <div className="mt-6"><RuntimeDetails template={template} /></div>
    </article>
  );
}

export function TemplateCatalogFormList({ data }: { data: AdminPageData }) {
  return (
    <div className="mt-8 grid gap-5">
      {data.catalogs.map((template) => <TemplateCatalogForm key={`${template.id}-${template.updatedAt}`} template={template} categories={data.categories} />)}
    </div>
  );
}
