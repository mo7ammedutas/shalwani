import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * RFC-6238 TOTP (SHA-1, 6 digits, 30s step) implemented on node:crypto —
 * no external dependency. Compatible with Google Authenticator, Authy,
 * 1Password, etc.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(): string {
  // 20 random bytes → 32 base32 chars, the authenticator-app standard size.
  const bytes = randomBytes(20);
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(msg).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return (code % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

export function totpCode(secret: string, now = Date.now()): string {
  return hotp(base32Decode(secret), Math.floor(now / 1000 / STEP_SECONDS));
}

/** Accepts the current step and one step either side (clock drift). */
export function verifyTotp(secret: string, input: string, now = Date.now()): boolean {
  const cleaned = input.replace(/\D/g, "");
  if (cleaned.length !== DIGITS) return false;
  const key = base32Decode(secret);
  const step = Math.floor(now / 1000 / STEP_SECONDS);
  for (const offset of [0, -1, 1]) {
    const expected = Buffer.from(hotp(key, step + offset));
    const actual = Buffer.from(cleaned);
    if (expected.length === actual.length && timingSafeEqual(expected, actual)) return true;
  }
  return false;
}

/** otpauth:// provisioning URI for authenticator apps. */
export function totpProvisioningUri(secret: string, accountLabel: string): string {
  const issuer = "Shalwani";
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountLabel)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=${DIGITS}&period=${STEP_SECONDS}`;
}
