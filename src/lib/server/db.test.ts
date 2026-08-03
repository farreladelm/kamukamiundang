// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import { getDatabaseUrl } from "./env";

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
});
