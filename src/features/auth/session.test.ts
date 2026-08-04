import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashOpaqueToken } from "./session";

describe("opaque session token helpers", () => {
  it("creates at least 256 bits of URL-safe entropy", () => {
    const token = createOpaqueToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(token, "base64url").byteLength).toBe(32);
  });

  it("hashes the raw token before database persistence", () => {
    const token = createOpaqueToken();

    expect(hashOpaqueToken(token)).not.toContain(token);
    expect(hashOpaqueToken(token)).toHaveLength(64);
  });
});
