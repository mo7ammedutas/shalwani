import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { isRole, type Role } from "@/lib/roles";

/**
 * Staff auth: each AdminUser has an email + password (scrypt-hashed) and a
 * role. A signed, expiring session token carries the user's id; the cookie
 * itself is opaque, so the token can't be tampered with, but revoking a
 * single user (deactivate/delete) takes effect immediately because we
 * re-load the row from the database on every check rather than trusting a
 * stateless claim.
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

export function createSessionToken(adminUserId: string, now = Date.now()): string {
  const expires = now + SESSION_HOURS * 3600_000;
  const payload = `${adminUserId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the admin user id encoded in a valid, unexpired token — or null. */
export function verifySessionToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [adminUserId, expires, signature] = parts;
  if (!adminUserId || !/^\d+$/.test(expires) || Number(expires) < now) return null;
  const expected = sign(`${adminUserId}.${expires}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return adminUserId;
}

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Verifies the session and loads the staff account fresh from the
 * database — a deactivated or deleted account loses access immediately. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const id = verifySessionToken(token);
  if (!id) return null;
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user || !user.active || !isRole(user.role)) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Convenience boolean for call sites that only need to know "logged in". */
export async function isAdmin(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}
