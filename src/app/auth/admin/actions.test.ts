import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialFormActionState } from "@/features/forms/action-state";

const {
  clearSessionCookieMock,
  cookiesMock,
  loginAdminMock,
  redirectMock,
  revokeSessionMock,
  setSessionCookieMock,
} = vi.hoisted(() => ({
  clearSessionCookieMock: vi.fn(),
  cookiesMock: vi.fn(),
  loginAdminMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  revokeSessionMock: vi.fn(),
  setSessionCookieMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("@/features/auth/admin-auth", () => ({ loginAdmin: loginAdminMock }));
vi.mock("@/features/auth/session", () => ({
  ADMIN_SESSION_COOKIE: "undango_admin_session",
  CUSTOMER_SESSION_COOKIE: "undango_customer_session",
  clearSessionCookie: clearSessionCookieMock,
  revokeSession: revokeSessionMock,
  setSessionCookie: setSessionCookieMock,
}));

import { adminLoginAction, adminLogoutAction } from "./actions";

function loginForm(email = "owner@example.com", password = "correct horse battery") {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("admin authentication actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      get: (name: string) => name === "undango_admin_session" ? { value: "admin-token" } : undefined,
    });
  });

  it("returns field errors without attempting authentication", async () => {
    const formData = loginForm("not-an-email", "short");

    const result = await adminLoginAction(initialFormActionState, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors.email).toContain("Masukkan alamat email yang valid.");
    expect(result.fieldErrors.password).toContain("Kata sandi minimal 12 karakter.");
    expect(loginAdminMock).not.toHaveBeenCalled();
  });

  it("sets admin session, clears customer session, and redirects after login", async () => {
    loginAdminMock.mockResolvedValue({ ok: true, adminId: "admin-1", sessionToken: "new-admin-token" });

    await expect(adminLoginAction(initialFormActionState, loginForm())).rejects.toThrow("REDIRECT:/admin");

    expect(loginAdminMock).toHaveBeenCalledWith({ email: "owner@example.com", password: "correct horse battery" });
    expect(clearSessionCookieMock).toHaveBeenCalledWith("undango_customer_session");
    expect(setSessionCookieMock).toHaveBeenCalledWith("undango_admin_session", "new-admin-token");
  });

  it("returns generic authentication errors without changing cookies", async () => {
    loginAdminMock.mockResolvedValue({ ok: false, error: "Email atau kata sandi salah." });

    await expect(adminLoginAction(initialFormActionState, loginForm())).resolves.toMatchObject({
      status: "error",
      message: "Email atau kata sandi salah.",
    });

    expect(clearSessionCookieMock).not.toHaveBeenCalled();
    expect(setSessionCookieMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("revokes current admin session, clears cookie, and redirects on logout", async () => {
    await expect(adminLogoutAction()).rejects.toThrow("REDIRECT:/auth/admin");

    expect(revokeSessionMock).toHaveBeenCalledWith("admin-token");
    expect(clearSessionCookieMock).toHaveBeenCalledWith("undango_admin_session");
  });
});
