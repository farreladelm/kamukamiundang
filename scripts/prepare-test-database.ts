import { spawnSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { getTestDatabaseUrl } from "./test-database";

loadEnvConfig(process.cwd());

const isWindows = process.platform === "win32";
const command = isWindows ? process.env.ComSpec ?? "cmd.exe" : "pnpm";
const environment: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: getTestDatabaseUrl(),
  NODE_ENV: "test",
};
const args = isWindows
  ? ["/d", "/s", "/c", "pnpm exec prisma migrate deploy"]
  : ["exec", "prisma", "migrate", "deploy"];

const result = spawnSync(command, args, {
  env: environment,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
