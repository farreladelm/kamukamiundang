import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { getTestDatabaseUrl } from "./scripts/test-database";

loadEnvConfig(process.cwd());
const testDatabaseUrl = getTestDatabaseUrl();

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm test:db:prepare && pnpm build && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: "test",
    },
  },
});
