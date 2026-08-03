import "server-only";

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set");
  }

  const protocol = new URL(databaseUrl).protocol;

  if (protocol !== "postgresql:" && protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use PostgreSQL");
  }

  return databaseUrl;
}
