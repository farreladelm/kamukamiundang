"use server";

import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  setSessionCookie,
  ADMIN_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
} from "@/features/auth/session";
import { loginAdmin } from "@/features/auth/admin-auth";
import {
  formDataToObject,
  adminLoginSchema,
} from "@/features/forms/schemas";
import {
  type FormActionState,
  formErrorState,
  initialFormActionState,
  zodErrorState,
} from "@/features/forms/action-state";

export async function adminLoginAction(
  _previousState: FormActionState = initialFormActionState,
  formData?: FormData,
): Promise<FormActionState> {
  void _previousState;
  const parsed = adminLoginSchema.safeParse(formDataToObject(formData ?? new FormData()));

  if (!parsed.success) return zodErrorState(parsed.error);

  const result = await loginAdmin(parsed.data);

  if (!result.ok) return formErrorState(result.error);

  await clearSessionCookie(CUSTOMER_SESSION_COOKIE);
  await setSessionCookie(ADMIN_SESSION_COOKIE, result.sessionToken);
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearSessionCookie(ADMIN_SESSION_COOKIE);
  redirect("/auth/admin");
}
