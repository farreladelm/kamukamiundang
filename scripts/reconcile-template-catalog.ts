import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const { reconcileTemplateCatalogWithClient } = await import(
    "../src/features/templates/catalog-reconciliation-core"
  );
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL must be set");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

  try {
    const report = await db.$transaction((tx) => reconcileTemplateCatalogWithClient(tx));
    process.stdout.write(`${JSON.stringify(report)}\n`);
    if (report.hasDrift) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch(() => {
  process.stderr.write("Template catalog reconciliation failed.\n");
  process.exitCode = 1;
});
