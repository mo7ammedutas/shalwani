import { describe, expect, it } from "vitest";
import { generateTotpSecret, totpCode, totpProvisioningUri, verifyTotp } from "@/lib/totp";

describe("TOTP", () => {
  it("generates a 32-char base32 secret", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(generateTotpSecret()).not.toBe(secret);
  });

  it("produces a 6-digit code that verifies at the same instant", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = totpCode(secret, now);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotp(secret, code, now)).toBe(true);
  });

  it("accepts one step of clock drift either side", () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    expect(verifyTotp(secret, totpCode(secret, now - 30_000), now)).toBe(true);
    expect(verifyTotp(secret, totpCode(secret, now + 30_000), now)).toBe(true);
  });

  it("rejects a code from two steps away", () => {
    const secret = generateTotpSecret();
    const now = 1_700_000_000_000;
    const stale = totpCode(secret, now - 90_000);
    const current = totpCode(secret, now);
    // Guard against the rare collision where both windows yield equal codes.
    if (stale !== current) expect(verifyTotp(secret, stale, now)).toBe(false);
  });

  it("rejects malformed input", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "", Date.now())).toBe(false);
    expect(verifyTotp(secret, "12345", Date.now())).toBe(false);
    expect(verifyTotp(secret, "abcdef", Date.now())).toBe(false);
  });

  it("matches RFC 6238 SHA-1 test vector", () => {
    // RFC 6238 Appendix B: ASCII "12345678901234567890" at T=59s → 94287082.
    // Base32 of that ASCII key:
    const rfcSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(totpCode(rfcSecret, 59_000)).toBe("287082"); // last 6 of 94287082
  });

  it("builds a scannable provisioning URI", () => {
    const uri = totpProvisioningUri("ABC234", "owner@shalwani.om");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=ABC234");
    expect(uri).toContain("issuer=Shalwani");
  });
});
