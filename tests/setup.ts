import { loadEnvConfig } from "@next/env";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { getTestDatabaseUrl } from "../scripts/test-database";

loadEnvConfig(process.cwd());

const testDatabaseUrl = getTestDatabaseUrl();
const databaseName = new URL(testDatabaseUrl).pathname.slice(1);

if (databaseName !== "undango_test") {
  throw new Error("Tests require DATABASE_URL database undango_test");
}
process.env.DATABASE_URL = testDatabaseUrl;

// Vitest lacks Next.js's react-server module condition; Next build enforces this marker.
vi.mock("server-only", () => ({}));

// Mock IntersectionObserver for framer-motion's whileInView animations
Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  },
});
