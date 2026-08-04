import { loadEnvConfig } from "@next/env";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

loadEnvConfig(process.cwd());

if (process.env.UNDANGO_INTEGRATION_TEST === "true") {
  const databaseUrl = process.env.DATABASE_URL;
  const databaseName = databaseUrl ? new URL(databaseUrl).pathname.slice(1) : "";

  if (databaseName !== "undango_test") {
    throw new Error("Integration tests require DATABASE_URL database undango_test");
  }
}

// Vitest lacks Next.js's react-server module condition; Next build enforces this marker.
vi.mock("server-only", () => ({}));
