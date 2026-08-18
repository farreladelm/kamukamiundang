import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadEnvConfig } from "@next/env";
import { getTestDatabaseUrl } from "../scripts/test-database";

const execFileAsync = promisify(execFile);

async function runPnpm(args: string[], databaseUrl: string) {
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "pnpm";
  const commandArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", `pnpm ${args.join(" ")}`]
    : args;

  await execFileAsync(command, commandArgs, {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: "test" },
  });
}

export default async function globalSetup() {
  loadEnvConfig(process.cwd());
  const databaseUrl = getTestDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;

  await runPnpm(["test:db:prepare"], databaseUrl);
  await runPnpm(["exec", "tsx", "scripts/e2e-admin-fixture.ts", "setup"], databaseUrl);

  return async () => {
    await runPnpm(["exec", "tsx", "scripts/e2e-admin-fixture.ts", "cleanup"], databaseUrl);
  };
}
