import { describe, expect, it } from "vitest";
import { matchBriefSchema } from "./schema";

describe("matchBriefSchema", () => {
  it("accepts a fully populated brief", () => {
    const result = matchBriefSchema.safeParse({ kategori: "klasik", nuansa: "warm" });
    expect(result.success).toBe(true);
  });

  it("accepts null fields", () => {
    const result = matchBriefSchema.safeParse({ kategori: null, nuansa: null });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown kategori value", () => {
    const result = matchBriefSchema.safeParse({ kategori: "vintage", nuansa: null });
    expect(result.success).toBe(false);
  });

  it("rejects a missing nuansa field", () => {
    const result = matchBriefSchema.safeParse({ kategori: null });
    expect(result.success).toBe(false);
  });
});
