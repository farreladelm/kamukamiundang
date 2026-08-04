import { spawnSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL must be set");

const testDatabaseUrl = new URL(databaseUrl);
testDatabaseUrl.pathname = "/undango_test";

const isWindows = process.platform === "win32";
const command = isWindows ? process.env.ComSpec ?? "cmd.exe" : "pnpm";
const environment: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl.toString(),
  NODE_ENV: "test",
  UNDANGO_INTEGRATION_TEST: "true",
};

function run(commandArgs: string[]): number {
  const args = isWindows
    ? ["/d", "/s", "/c", ["pnpm", ...commandArgs].join(" ")]
    : commandArgs;
  const result = spawnSync(command, args, {
    env: environment,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

const migrationStatus = run(["exec", "prisma", "migrate", "deploy"]);
process.exitCode = migrationStatus === 0
  ? run(["exec", "vitest", "run", "tests/integration", "--passWithNoTests", "--no-file-parallelism"])
  : migrationStatus;
