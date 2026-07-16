import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/** Customer-facing session — same signed-cookie pattern as the admin panel,
 * but the token carries a customer id (subject) rather than a bare flag. */

export const CUSTOMER_COOKIE = "shalwani_customer";
const SESSION_DAYS = 30;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Missing required environment variable AUTH_SECRET");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createCustomerSessionToken(customerId: string, now = Date.now()): string {
  const expires = now + SESSION_DAYS * 24 * 3600_000;
  const payload = `${customerId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [customerId, expires, signature] = parts;
  if (!customerId || !/^\d+$/.test(expires) || Number(expires) < now) return null;
  const expected = sign(`${customerId}.${expires}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return customerId;
}

/** Verifies the session and loads the customer fresh from the database —
 * a deleted/edited account loses access immediately rather than trusting
 * a stale signed payload. */
export async function getCurrentCustomer() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  const customerId = verifyToken(token);
  if (!customerId) return null;
  return prisma.customer.findUnique({ where: { id: customerId } });
}
