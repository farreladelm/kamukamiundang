"use client";

import { useActionState, useEffect } from "react";
import { createPendingOrderAction } from "@/app/admin/orders/actions";
import { useAdminToast } from "@/features/admin/admin-toast";
import {
  initialFormActionState,
  type FormActionState,
} from "@/features/forms/action-state";

type TemplateSelection = { value: string; label: string };

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return <p id={`${id}-error`} className="text-xs text-red-800" role="alert">{errors[0]}</p>;
}

export function OrderForm({ selections }: { selections: TemplateSelection[] }) {
  const { showToast } = useAdminToast();
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    createPendingOrderAction,
    initialFormActionState,
  );

  useEffect(() => {
    if (state.status === "success") showToast(state.message);
    if (state.status === "error") showToast(state.message, "error");
  }, [showToast, state.message, state.status]);

  return (
    <form action={formAction} noValidate className="mt-8 grid gap-4 border border-stone-300 bg-white p-6">
      {state.message && <p className={state.status === "success" ? "text-sm text-green-800" : "text-sm text-red-800"} role="alert">{state.message}</p>}
      <label className="grid gap-2 text-sm font-medium" htmlFor="customer-name">
        Nama customer
        <input id="customer-name" required name="customerName" aria-invalid={Boolean(state.fieldErrors.customerName?.length)} aria-describedby={state.fieldErrors.customerName?.length ? "customer-name-error" : undefined} className="min-h-12 border border-stone-300 px-3 aria-[invalid=true]:border-red-700" />
        <FieldError id="customer-name" errors={state.fieldErrors.customerName} />
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="customer-whatsapp">
        WhatsApp
        <input id="customer-whatsapp" name="whatsapp" inputMode="tel" aria-invalid={Boolean(state.fieldErrors.whatsapp?.length)} aria-describedby={state.fieldErrors.whatsapp?.length ? "customer-whatsapp-error" : undefined} className="min-h-12 border border-stone-300 px-3 aria-[invalid=true]:border-red-700" />
        <FieldError id="customer-whatsapp" errors={state.fieldErrors.whatsapp} />
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="customer-email">
        Email
        <input id="customer-email" name="email" type="email" aria-invalid={Boolean(state.fieldErrors.email?.length)} aria-describedby={state.fieldErrors.email?.length ? "customer-email-error" : undefined} className="min-h-12 border border-stone-300 px-3 aria-[invalid=true]:border-red-700" />
        <FieldError id="customer-email" errors={state.fieldErrors.email} />
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="requested-invitation-slug">
        URL publik
        <span className="text-xs font-normal text-stone-500">/i/ kosongkan bila belum ditentukan</span>
        <input id="requested-invitation-slug" name="requestedInvitationSlug" autoCapitalize="none" aria-invalid={Boolean(state.fieldErrors.requestedInvitationSlug?.length)} aria-describedby={state.fieldErrors.requestedInvitationSlug?.length ? "requested-invitation-slug-error" : undefined} className="min-h-12 border border-stone-300 px-3 aria-[invalid=true]:border-red-700" placeholder="farrel-kinan-wedding" />
        <FieldError id="requested-invitation-slug" errors={state.fieldErrors.requestedInvitationSlug} />
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="template-selection">
        Template dan palette
        <select id="template-selection" name="templateSelection" defaultValue={selections[0]?.value} aria-invalid={Boolean(state.fieldErrors.templateSelection?.length)} aria-describedby={state.fieldErrors.templateSelection?.length ? "template-selection-error" : undefined} className="min-h-12 border border-stone-300 px-3 aria-[invalid=true]:border-red-700">
          <option value="">Pilih template</option>
          {selections.map((selection) => <option key={selection.value} value={selection.value}>{selection.label}</option>)}
        </select>
        <FieldError id="template-selection" errors={state.fieldErrors.templateSelection} />
      </label>
      <label className="grid gap-2 text-sm font-medium" htmlFor="photo-limit">
        Batas foto
        <input id="photo-limit" required name="photoLimit" type="number" min="0" defaultValue="20" aria-invalid={Boolean(state.fieldErrors.photoLimit?.length)} aria-describedby={state.fieldErrors.photoLimit?.length ? "photo-limit-error" : undefined} className="min-h-12 border border-stone-300 px-3 aria-[invalid=true]:border-red-700" />
        <FieldError id="photo-limit" errors={state.fieldErrors.photoLimit} />
      </label>
      <button type="submit" disabled={pending} className="mt-3 min-h-12 bg-stone-900 px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50">
        {pending ? "Menyimpan..." : "Simpan pending"}
      </button>
    </form>
  );
}
