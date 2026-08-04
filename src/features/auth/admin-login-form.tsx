"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/auth/admin/actions";
import {
  initialFormActionState,
  type FormActionState,
} from "@/features/forms/action-state";

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;

  return (
    <p id={`${id}-error`} className="text-xs text-red-800" role="alert">
      {errors[0]}
    </p>
  );
}

export function AdminLoginForm({ initialError = "" }: { initialError?: string }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    adminLoginAction,
    initialError ? { ...initialFormActionState, status: "error", message: initialError, formErrors: [initialError] } : initialFormActionState,
  );

  return (
    <form action={formAction} noValidate className="mt-8 grid gap-4">
      {state.message && (
        <p className={state.status === "success" ? "text-sm text-green-800" : "text-sm text-red-800"} role="alert">
          {state.message}
        </p>
      )}
      <label className="grid gap-2 text-sm font-medium text-stone-700" htmlFor="admin-email">
        Email
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          aria-invalid={Boolean(state.fieldErrors.email?.length)}
          aria-describedby={state.fieldErrors.email?.length ? "admin-email-error" : undefined}
          className="min-h-12 border border-stone-300 px-3 aria-[invalid=true]:border-red-700"
        />
        <FieldError id="admin-email" errors={state.fieldErrors.email} />
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-700" htmlFor="admin-password">
        Kata sandi
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors.password?.length)}
          aria-describedby={state.fieldErrors.password?.length ? "admin-password-error" : undefined}
          className="min-h-12 border border-stone-300 px-3 aria-[invalid=true]:border-red-700"
        />
        <FieldError id="admin-password" errors={state.fieldErrors.password} />
      </label>
      <button type="submit" disabled={pending} className="mt-3 min-h-12 bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-amber-900 disabled:cursor-wait disabled:opacity-50">
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
      <p className="text-xs leading-5 text-stone-500">Email atau kata sandi salah jika kredensial tidak cocok.</p>
    </form>
  );
}
