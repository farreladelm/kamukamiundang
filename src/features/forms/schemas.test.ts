import { describe, expect, it } from "vitest";
import { adminLoginSchema, orderIntakeSchema, wishSubmissionSchema } from "./schemas";

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

  it("validates plain-text wish submissions at the server boundary", () => {
    expect(wishSubmissionSchema.parse({
      name: "  Guest  ",
      message: "  Selamat!  ",
      honeypot: "",
    })).toEqual({ name: "Guest", message: "Selamat!", honeypot: "" });
    expect(wishSubmissionSchema.safeParse({
      name: "G".repeat(101),
      message: "Selamat!",
      honeypot: "",
    }).success).toBe(false);
    expect(wishSubmissionSchema.safeParse({
      name: "Guest",
      message: "M".repeat(1001),
      honeypot: "",
    }).success).toBe(false);
    expect(wishSubmissionSchema.safeParse({
      name: "Guest",
      message: "Selamat!",
      honeypot: "",
      phone: "08123456789",
    }).success).toBe(false);
  });
});
