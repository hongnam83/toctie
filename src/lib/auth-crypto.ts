import crypto from "crypto";

/**
 * Standard scrypt password hashing for production security
 * Format: scrypt:v1:<salt>:<derivedKey>
 */
export function hashPassword(password?: string): string {
  if (!password || password === "passwordless") {
    // Generate secure randomized hash even for passwordless accounts
    const randomSecret = crypto.randomBytes(32).toString("hex");
    const salt = crypto.randomBytes(16).toString("hex");
    const key = crypto.scryptSync(randomSecret, salt, 64).toString("hex");
    return `scrypt:v1:${salt}:${key}`;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const key = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:v1:${salt}:${key}`;
}

/**
 * Verify a plain text password against stored hash with timing safe equality
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }

  // Legacy passwordless support
  if (storedHash === "passwordless") {
    return true;
  }

  // Check legacy simpleHash format
  if (!storedHash.startsWith("scrypt:v1:")) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const legacySimple = Math.abs(hash).toString(16);
    return legacySimple === storedHash;
  }

  const parts = storedHash.split(":");
  if (parts.length !== 4) {
    return false;
  }

  const salt = parts[2];
  const originalKey = parts[3];

  try {
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(originalKey, "hex"),
      Buffer.from(derivedKey, "hex")
    );
  } catch {
    return false;
  }
}

