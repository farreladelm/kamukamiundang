import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashAdminPassword, normalizeAdminEmail } from "../src/features/auth/password-core";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL must be set");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const readline = createInterface({ input, output });

function hiddenQuestion(prompt: string): Promise<string> {
  if (!input.isTTY || !input.setRawMode) return readline.question(prompt);

  output.write(prompt);
  input.setRawMode(true);
  input.resume();

  return new Promise((resolve) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      const character = chunk.toString();
      if (character === "\u0003") process.exit(1);
      if (character === "\r" || character === "\n") {
        input.setRawMode?.(false);
        input.pause();
        input.off("data", onData);
        output.write("\n");
        resolve(value);
        return;
      }
      if (character === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      value += character;
    };

    input.on("data", onData);
  });
}

async function main(): Promise<void> {
  try {
    const email = await readline.question("Admin email: ");
    const password = await hiddenQuestion("Admin password: ");

    const normalizedEmail = normalizeAdminEmail(email);
    const passwordHash = await hashAdminPassword(password);
    await db.$transaction(async (tx) => {
      const admin = await tx.admin.upsert({
        where: { email: normalizedEmail },
        create: { email: normalizedEmail, passwordHash, isActive: true },
        update: { passwordHash, isActive: true },
        select: { id: true },
      });

      await tx.session.updateMany({
        where: { adminId: admin.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    process.stdout.write("Admin credential updated.\n");
  } finally {
    readline.close();
    await db.$disconnect();
  }
}

main().catch(() => {
  process.stderr.write("Unable to update admin credential.\n");
  process.exitCode = 1;
});
