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

export function getApplicationOrigin(fallbackOrigin?: string): string {
  const configuredOrigin = process.env.APP_URL?.trim();

  if (configuredOrigin) {
    const url = new URL(configuredOrigin);
    if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:")) {
      throw new Error("APP_URL must use HTTPS");
    }
    return url.origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL must be set in production");
  }

  if (!fallbackOrigin) throw new Error("Application origin must be set");
  return new URL(fallbackOrigin).origin;
}
