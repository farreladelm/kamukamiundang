import { describe, expect, it } from "vitest";
import { adminLoginAction } from "./actions";
import { initialFormActionState } from "@/features/forms/action-state";

describe("admin login action", () => {
  it("returns field errors without attempting authentication", async () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "short");

    const result = await adminLoginAction(initialFormActionState, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors.email).toContain("Masukkan alamat email yang valid.");
    expect(result.fieldErrors.password).toContain("Kata sandi minimal 12 karakter.");
  });
});
