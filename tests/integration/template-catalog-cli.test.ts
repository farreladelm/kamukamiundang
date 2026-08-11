import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { expect, it } from "vitest";
import { db } from "@/lib/server/db";

const execFileAsync = promisify(execFile);

it("runs template catalog reconciliation from the CLI", async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "Invitation", "Order", "Customer" CASCADE',
  );
  const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "pnpm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "pnpm templates:reconcile"]
    : ["templates:reconcile"];
  let stdout: string;
  let stderr: string;
  try {
    ({ stdout, stderr } = await execFileAsync(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    }));
  } catch (error) {
    const result = error as { stdout?: string; stderr?: string };
    throw new Error(`Reconciliation CLI failed.\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  }
  const report = JSON.parse(stdout.trim().split("\n").at(-1) ?? "");

  expect(stderr).not.toContain("server-only");
  expect(report).toMatchObject({ hasDrift: false });
}, 30_000);
