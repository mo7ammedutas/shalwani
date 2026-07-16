import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** scrypt password hashing — no extra dependency, built on Node's crypto
 * (same module already used for the HMAC session tokens). Format:
 * "<saltHex>:<hashHex>". */

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPasswordHash(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, KEY_LEN);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
