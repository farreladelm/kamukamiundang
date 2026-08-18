import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashAdminPassword } from "../src/features/auth/password-core";
import { getTestDatabaseUrl } from "./test-database";

const email = "e2e-admin@example.com";
const password = "correct horse battery";

async function main() {
  loadEnvConfig(process.cwd());
  const databaseUrl = getTestDatabaseUrl();
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  try {
    if (process.argv[2] === "cleanup") {
      await db.admin.deleteMany({ where: { email } });
      return;
    }

    const passwordHash = await hashAdminPassword(password);
    const admin = await db.admin.upsert({
      where: { email },
      create: { email, passwordHash, isActive: true },
      update: { passwordHash, isActive: true },
      select: { id: true },
    });
    await db.session.deleteMany({ where: { adminId: admin.id } });
    await db.templateCatalog.updateMany({
      where: { templateKey: { in: ["template-1", "template-2", "template-3"] } },
      data: { status: "VISIBLE" },
    });
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
