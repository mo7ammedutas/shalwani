import "server-only";
import { prisma } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by Postgres. Chosen over an in-memory
 * counter because Vercel serverless instances don't share memory, and over
 * Redis because the stack has no Redis — one extra indexed upsert per
 * guarded request is fine at boutique traffic volumes.
 *
 * key = "<scope>:<identifier>", e.g. "login:96891234567" or "checkout:1.2.3.4".
 */

export interface RateLimitRule {
  windowSeconds: number;
  max: number;
}

export const RATE_LIMITS = {
  /** Credential guessing: per identifier (email/phone), tight. */
  login: { windowSeconds: 15 * 60, max: 10 },
  /** Account creation: per IP. */
  register: { windowSeconds: 60 * 60, max: 10 },
  /** Order creation: per IP — generous, a legit customer retries a few times. */
  checkout: { windowSeconds: 10 * 60, max: 20 },
  /** Webhook floods: per IP. */
  webhook: { windowSeconds: 60, max: 30 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitScope = keyof typeof RATE_LIMITS;

/** Returns true when the request is allowed, false when over the limit.
 * Fails open on database errors — availability of login/checkout matters
 * more than strict enforcement during a transient outage. */
export async function checkRateLimit(scope: RateLimitScope, identifier: string): Promise<boolean> {
  // The e2e suite logs in dozens of times per run and would throttle
  // itself; same escape hatch pattern as THAWANI_MOCK.
  if (process.env.RATE_LIMIT_DISABLED === "1") return true;

  const rule = RATE_LIMITS[scope];
  const key = `${scope}:${identifier}`.slice(0, 200);
  const now = new Date();
  const windowStartCutoff = new Date(now.getTime() - rule.windowSeconds * 1000);

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.windowStart < windowStartCutoff) {
      await prisma.rateLimit.upsert({
        where: { key },
        update: { windowStart: now, count: 1 },
        create: { key, windowStart: now, count: 1 },
      });
      return true;
    }

    if (existing.count >= rule.max) return false;

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return true;
  } catch (err) {
    console.error(`rate-limit check failed for ${key}:`, err);
    return true;
  }
}

/** Best-effort client IP for per-IP scopes (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}
