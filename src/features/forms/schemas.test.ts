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

  it("accepts blank and kebab-case requested invitation slugs", () => {
    const baseOrder = {
      customerName: "Farrel",
      templateSelection: "template-1|1|gading",
      photoLimit: "20",
    };

    expect(orderIntakeSchema.parse({ ...baseOrder, requestedInvitationSlug: "" }).requestedInvitationSlug).toBeUndefined();
    expect(orderIntakeSchema.parse({ ...baseOrder, requestedInvitationSlug: "farrel-kinan-wedding" }).requestedInvitationSlug).toBe("farrel-kinan-wedding");
  });

  it("rejects malformed requested invitation slugs", () => {
    const baseOrder = {
      customerName: "Farrel",
      templateSelection: "template-1|1|gading",
      photoLimit: "20",
    };

    for (const requestedInvitationSlug of ["ab", "Farrel", "farrel kinan", "farrel--kinan", "-farrel", "farrel-"]) {
      expect(orderIntakeSchema.safeParse({ ...baseOrder, requestedInvitationSlug }).success).toBe(false);
    }
  });
});
