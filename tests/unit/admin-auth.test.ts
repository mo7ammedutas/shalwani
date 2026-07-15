import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "unit-test-secret";
  process.env.ADMIN_PASSWORD = "unit-test-password";
});

// admin-auth imports `server-only` and next/headers; pull the pure pieces
// via dynamic import after env is set, with the server-only shim below.
async function lib() {
  return await import("@/lib/admin-auth");
}

describe("admin session tokens", () => {
  it("round-trips a freshly issued token", async () => {
    const { createSessionToken, verifySessionToken } = await lib();
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects expired tokens", async () => {
    const { createSessionToken, verifySessionToken } = await lib();
    const twoWeeksAgo = Date.now() - 14 * 24 * 3600_000;
    const token = createSessionToken(twoWeeksAgo);
    expect(verifySessionToken(token)).toBe(false);
  });

  it("rejects tampered expiry and signature", async () => {
    const { createSessionToken, verifySessionToken } = await lib();
    const token = createSessionToken();
    const [expires, signature] = token.split(".");
    expect(verifySessionToken(`${Number(expires) + 9999999}.${signature}`)).toBe(false);
    expect(verifySessionToken(`${expires}.${signature.slice(0, -2)}xx`)).toBe(false);
    expect(verifySessionToken("garbage")).toBe(false);
    expect(verifySessionToken(undefined)).toBe(false);
  });

  it("verifies the admin password with constant-time comparison semantics", async () => {
    const { verifyPassword } = await lib();
    expect(verifyPassword("unit-test-password")).toBe(true);
    expect(verifyPassword("unit-test-password!")).toBe(false);
    expect(verifyPassword("")).toBe(false);
  });
});
