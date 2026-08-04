import { describe, expect, it } from "vitest";
import { adminLoginSchema, orderIntakeSchema } from "./schemas";

describe("form schemas", () => {
  it("returns field errors for invalid admin credentials", () => {
    const result = adminLoginSchema.safeParse({ email: "wrong", password: "short" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.email).toContain(
      "Masukkan alamat email yang valid.",
    );
    expect(result.error.flatten().fieldErrors.password).toContain(
      "Kata sandi minimal 12 karakter.",
    );
  });

  it("rejects incomplete order intake data", () => {
    const result = orderIntakeSchema.safeParse({
      customerName: "",
      email: "not-an-email",
      templateSelection: "",
      photoLimit: "-1",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(Object.keys(result.error.flatten().fieldErrors)).toEqual(
      expect.arrayContaining(["customerName", "email", "templateSelection", "photoLimit"]),
    );
  });
});
