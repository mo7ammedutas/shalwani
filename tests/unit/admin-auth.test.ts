import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "unit-test-secret";
});

// admin-auth imports `server-only`, next/headers and the Prisma client;
// pull the pure token functions via dynamic import after env is set, with
// the shims in tests/shims/ covering the non-pure imports.
async function lib() {
  return await import("@/lib/admin-auth");
}

const USER_ID = "usr_test123";

describe("admin session tokens", () => {
  it("round-trips a freshly issued token", async () => {
    const { createSessionToken, verifySessionToken } = await lib();
    const token = createSessionToken(USER_ID);
    expect(verifySessionToken(token)).toBe(USER_ID);
  });

  it("rejects expired tokens", async () => {
    const { createSessionToken, verifySessionToken } = await lib();
    const twoWeeksAgo = Date.now() - 14 * 24 * 3600_000;
    const token = createSessionToken(USER_ID, twoWeeksAgo);
    expect(verifySessionToken(token)).toBeNull();
  });

  it("rejects tampered expiry and signature", async () => {
    const { createSessionToken, verifySessionToken } = await lib();
    const token = createSessionToken(USER_ID);
    const [id, expires, signature] = token.split(".");
    expect(verifySessionToken(`${id}.${Number(expires) + 9999999}.${signature}`)).toBeNull();
    expect(verifySessionToken(`${id}.${expires}.${signature.slice(0, -2)}xx`)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
  });

  it("distinguishes tokens issued for different users", async () => {
    const { createSessionToken, verifySessionToken } = await lib();
    const tokenA = createSessionToken("usr_a");
    const tokenB = createSessionToken("usr_b");
    expect(verifySessionToken(tokenA)).toBe("usr_a");
    expect(verifySessionToken(tokenB)).toBe("usr_b");
  });
});

describe("password hashing", () => {
  it("verifies a matching password and rejects a wrong one", async () => {
    const { hashPassword, verifyPasswordHash } = await import("@/lib/password");
    const stored = hashPassword("correct-horse-battery-staple");
    expect(verifyPasswordHash("correct-horse-battery-staple", stored)).toBe(true);
    expect(verifyPasswordHash("wrong-password", stored)).toBe(false);
  });

  it("rejects malformed stored hashes safely", async () => {
    const { verifyPasswordHash } = await import("@/lib/password");
    expect(verifyPasswordHash("anything", "not-a-valid-hash")).toBe(false);
    expect(verifyPasswordHash("anything", "")).toBe(false);
  });
});
