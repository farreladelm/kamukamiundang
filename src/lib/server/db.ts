import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl } from "./env";

const globalForPrisma = globalThis as unknown as {
  db: PrismaClient | undefined;
};

function createDatabaseClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });
}

export const db = globalForPrisma.db ?? createDatabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}
