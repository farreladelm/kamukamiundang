import argon2 from "argon2";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

export function normalizeAdminEmail(email: string): string {
  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Invalid admin email");
  }

  return normalized;
}

function assertPasswordPolicy(password: string): void {
  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new Error("Password must be 12-128 characters");
  }
}

export async function hashAdminPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);

  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyAdminPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  if (typeof passwordHash !== "string" || typeof password !== "string") {
    return false;
  }

  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}
