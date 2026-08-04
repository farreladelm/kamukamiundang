// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import { getApplicationOrigin, getDatabaseUrl } from "./env";

describe("getDatabaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a missing database URL", () => {
    vi.stubEnv("DATABASE_URL", "");

    expect(() => getDatabaseUrl()).toThrow("DATABASE_URL must be set");
  });

  it("rejects a non-PostgreSQL database URL", () => {
    vi.stubEnv("DATABASE_URL", "https://example.com/database");

    expect(() => getDatabaseUrl()).toThrow("DATABASE_URL must use PostgreSQL");
  });

  it("returns a PostgreSQL database URL", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:password@localhost:5432/undango");

    expect(getDatabaseUrl()).toBe(
      "postgresql://user:password@localhost:5432/undango",
    );
  });

  it("uses a configured HTTPS application origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://undango.example/invitations");

    expect(getApplicationOrigin("http://spoofed.example")).toBe("https://undango.example");
  });

  it("rejects an unset production application origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "");

    expect(() => getApplicationOrigin("http://localhost:3000")).toThrow(
      "APP_URL must be set in production",
    );
  });
});
