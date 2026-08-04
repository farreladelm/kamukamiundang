import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: vi.fn(() => undefined) })),
}));
vi.mock("./session", () => ({
  ADMIN_SESSION_COOKIE: "admin",
  CUSTOMER_SESSION_COOKIE: "customer",
  getAdminSession: vi.fn(async () => null),
  getCustomerSession: vi.fn(async () => null),
}));

import { requireAdmin } from "./policies";

describe("admin authorization boundary", () => {
  beforeEach(() => redirect.mockClear());

  it("redirects stale or missing admin sessions to login", async () => {
    await requireAdmin();
    expect(redirect).toHaveBeenCalledWith("/auth/admin?reason=session-expired");
  });
});
