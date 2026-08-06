export function getTestDatabaseUrl(databaseUrl = process.env.DATABASE_URL): string {
  if (!databaseUrl) throw new Error("DATABASE_URL must be set");

  const testDatabaseUrl = new URL(databaseUrl);
  testDatabaseUrl.pathname = "/undango_test";
  return testDatabaseUrl.toString();
}
