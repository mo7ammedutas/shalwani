import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-merchant admin auth: ADMIN_PASSWORD unlocks a signed, expiring
 * session token stored in an HTTP-only cookie. No accounts, no database —
 * exactly enough for one shop owner.
 */

export const ADMIN_COOKIE = "shalwani_admin";
const SESSION_HOURS = 24 * 7;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Missing required environment variable AUTH_SECRET");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(now = Date.now()): string {
  const expires = now + SESSION_HOURS * 3600_000;
  return `${expires}.${sign(String(expires))}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (!/^\d+$/.test(expires) || Number(expires) < now) return false;
  const expected = sign(expires);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyPassword(candidate: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when the current request carries a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
}
