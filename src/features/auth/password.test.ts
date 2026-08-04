import { describe, expect, it } from "vitest";
import {
  hashAdminPassword,
  normalizeAdminEmail,
  verifyAdminPassword,
} from "./password";

describe("admin password helpers", () => {
  it("normalizes admin email before persistence", () => {
    expect(normalizeAdminEmail("  OWNER@Example.COM ")).toBe("owner@example.com");
  });

  it("accepts 12-128 characters and produces Argon2id hashes", async () => {
    const hash = await hashAdminPassword("correct horse battery");

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyAdminPassword(hash, "correct horse battery")).resolves.toBe(true);
  });

  it("rejects passwords outside the operator policy", async () => {
    await expect(hashAdminPassword("too-short")).rejects.toThrow(
      "Password must be 12-128 characters",
    );
    await expect(hashAdminPassword("x".repeat(129))).rejects.toThrow(
      "Password must be 12-128 characters",
    );
  });

  it("returns false for invalid hashes and mismatches without leaking details", async () => {
    await expect(verifyAdminPassword("not-a-hash", "correct horse battery")).resolves.toBe(false);
    await expect(
      verifyAdminPassword(await hashAdminPassword("correct horse battery"), "wrong password"),
    ).resolves.toBe(false);
  });
});
