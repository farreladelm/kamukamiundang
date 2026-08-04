import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  getAdminSession,
  getCustomerSession,
} from "./session";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const actor = await getAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!actor) redirect("/auth/admin?reason=session-expired");
  return actor;
}

export async function requireCustomer() {
  const cookieStore = await cookies();
  const actor = await getCustomerSession(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);

  if (!actor) throw new Error("Customer authentication required");
  return actor;
}
