import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashOpaqueToken, isMagicLinkUsable } from "./magic-link";

describe("magic-link policy", () => {
  it("uses a 256-bit token and stores only its digest", () => {
    const rawToken = createOpaqueToken();

    expect(Buffer.from(rawToken, "base64url").byteLength).toBe(32);
    expect(hashOpaqueToken(rawToken)).not.toContain(rawToken);
  });

  it("requires an unconsumed, unrevoked, unexpired link", () => {
    const now = new Date("2026-08-03T12:00:00.000Z");
    const usable = { consumedAt: null, revokedAt: null, expiresAt: new Date("2026-08-03T13:00:00.000Z") };

    expect(isMagicLinkUsable(usable, now)).toBe(true);
    expect(isMagicLinkUsable({ ...usable, consumedAt: now }, now)).toBe(false);
    expect(isMagicLinkUsable({ ...usable, revokedAt: now }, now)).toBe(false);
    expect(isMagicLinkUsable({ ...usable, expiresAt: now }, now)).toBe(false);
  });
});
