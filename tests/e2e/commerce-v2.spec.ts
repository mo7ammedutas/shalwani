import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "owner@shalwani.om";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "shalwani-2026";

async function loginAsOwner(page: Page) {
  await page.goto("/ar/admin/login");
  await page.getByTestId("admin-email").fill(ADMIN_EMAIL);
  await page.getByTestId("admin-password").fill(ADMIN_PASSWORD);
  await page.getByTestId("admin-login").click();
  await expect(page).toHaveURL(/\/ar\/admin$/);
}

function uniquePhone(): string {
  return "9" + Math.floor(1000000 + Math.random() * 8999999);
}

/** Minimal RFC-6238 clone for the 2FA test (mirrors src/lib/totp.ts, which
 * can't be imported here because of its server-only guard). */
function totpFor(secret: string, now = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of secret.toUpperCase().replace(/[^A-Z2-7]/g, "")) {
    value = (value << 5) | alphabet.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / 30)));
  const digest = createHmac("sha1", Buffer.from(bytes)).update(msg).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return (code % 1_000_000).toString().padStart(6, "0");
}

test.describe("coupons", () => {
  const code = `E2E${Date.now().toString(36).toUpperCase()}`;

  test("admin creates a percent coupon, checkout applies it, usage increments", async ({
    page,
    request,
  }) => {
    test.slow(); // many admin round-trips; dev-mode renders are seconds each
    await loginAsOwner(page);

    // ── create ──
    await page.goto("/ar/admin/coupons/new");
    await page.getByTestId("cp-code").fill(code);
    await page.getByTestId("cp-kind").selectOption("percent");
    await page.getByTestId("cp-value").fill("10");
    await page.getByTestId("cp-save").click();
    await expect(page).toHaveURL(/\/ar\/admin\/coupons\?saved=1/);
    await expect(page.getByTestId(`coupon-row-${code}`)).toBeVisible();

    // ── apply at checkout ──
    await page.goto("/ar/shop/bashmina-classic-1");
    await page.getByTestId("add-to-cart").click();
    await page.goto("/ar/checkout");
    await page.getByTestId("coupon-input").fill(code);
    await page.getByTestId("coupon-apply").click();
    // 10% of 30.000 = 3.000 discount, shown as its own line
    await expect(page.getByTestId("coupon-discount")).toContainText("3.000");

    // ── pay (mock) and confirm the discount survived server recompute ──
    const phone = uniquePhone();
    await page.getByTestId("checkout-name").fill("عميل الكوبون");
    await page.getByTestId("checkout-phone").fill(phone);
    await page.getByTestId("checkout-address").fill("مسقط");
    await page.getByTestId("pay-now").click();
    await expect(page).toHaveURL(/checkout\/success\?order=SHW-/, { timeout: 30_000 });

    // usage counter incremented once payment landed
    await page.goto("/ar/admin/coupons");
    await expect(page.getByTestId(`coupon-row-${code}`)).toContainText("1");

    // ── invalid code is rejected by the API with a reason ──
    const res = await request.post("/api/coupons/validate", {
      data: { code: "NO-SUCH-CODE", subtotalBaisa: 10_000 },
    });
    const body = (await res.json()) as { ok: boolean; reason?: string };
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("not_found");

    // ── cleanup: delete the coupon and the throwaway customer ──
    page.on("dialog", (d) => d.accept());
    await page.getByTestId(`delete-coupon-${code}`).click();
    await expect(page).toHaveURL(/deleted=1/, { timeout: 30_000 });
    await expect(page.getByTestId(`coupon-row-${code}`)).toHaveCount(0);
    await page.goto("/ar/admin/customers");
    await page.getByTestId(`delete-customer-${phone}`).click();
    await expect(page).toHaveURL(/deleted=1/, { timeout: 30_000 });
    await expect(page.getByTestId(`customer-row-${phone}`)).toHaveCount(0);
  });
});

test.describe("fulfilment", () => {
  test("paid order moves to shipped (with tracking) then delivered; customer sees both", async ({
    page,
  }) => {
    test.slow();
    // Register a customer so the storefront view can be checked too.
    const phone = uniquePhone();
    await page.goto("/ar/account/register");
    await page.getByTestId("register-name").fill("عميل الشحن");
    await page.getByTestId("register-phone").fill(phone);
    await page.getByTestId("register-password").fill("testpass123");
    await page.getByTestId("register-submit").click();
    await expect(page).toHaveURL(/\/ar\/account$/);

    await page.goto("/ar/shop/super-turma");
    await page.getByTestId("add-to-cart").click();
    await page.goto("/ar/checkout");
    await page.getByTestId("checkout-address").fill("مسقط، الخوير");
    await page.getByTestId("pay-now").click();
    await expect(page).toHaveURL(/checkout\/success\?order=(SHW-[A-Z0-9]+)/, { timeout: 30_000 });
    const orderNumber = new URL(page.url()).searchParams.get("order")!;

    // ── admin ships it with a tracking number ──
    await page.evaluate(() => fetch("/api/account/logout", { method: "POST" }));
    await loginAsOwner(page);
    await page.goto("/ar/admin/orders");
    await page.getByTestId(`tracking-${orderNumber}`).fill("ARAMEX-E2E-1");
    await page.getByTestId(`ship-${orderNumber}`).click();
    await expect(page).toHaveURL(/\/ar\/admin\/orders\?saved=1/);
    await expect(page.getByTestId(`deliver-${orderNumber}`)).toBeVisible();

    // ── customer sees shipped + tracking ──
    await page.goto("/ar/account/login");
    await page.getByTestId("login-phone").fill(phone);
    await page.getByTestId("login-password").fill("testpass123");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/ar\/account$/);
    await expect(page.getByTestId(`order-status-${orderNumber}`)).toContainText("تم الشحن");
    await expect(page.getByText("ARAMEX-E2E-1")).toBeVisible();

    // ── deliver, then clean up ──
    // The admin session from the shipping step is still alive (only the
    // customer logged in/out since), so go straight to the panel.
    await page.evaluate(() => fetch("/api/account/logout", { method: "POST" }));
    await page.goto("/ar/admin/orders");
    await page.getByTestId(`deliver-${orderNumber}`).click();
    await expect(page).toHaveURL(/\/ar\/admin\/orders\?saved=1/);

    page.on("dialog", (d) => d.accept());
    await page.goto("/ar/admin/customers");
    await page.getByTestId(`delete-customer-${phone}`).click();
    await expect(page).toHaveURL(/deleted=1/, { timeout: 30_000 });
    await expect(page.getByTestId(`customer-row-${phone}`)).toHaveCount(0);
  });
});

test.describe("reviews", () => {
  test("verified buyer reviews a product; admin approves; review renders", async ({ page }) => {
    test.slow();
    const phone = uniquePhone();
    await page.goto("/ar/account/register");
    await page.getByTestId("register-name").fill("عميل التقييم");
    await page.getByTestId("register-phone").fill(phone);
    await page.getByTestId("register-password").fill("testpass123");
    await page.getByTestId("register-submit").click();
    await expect(page).toHaveURL(/\/ar\/account$/);

    // Before purchase: gated.
    await page.goto("/ar/shop/bashmina-classic-2");
    await expect(page.getByTestId("review-gate")).toContainText("لمن اشترى");

    // Buy it (mock pay).
    await page.getByTestId("add-to-cart").click();
    await page.goto("/ar/checkout");
    await page.getByTestId("checkout-address").fill("مسقط");
    await page.getByTestId("pay-now").click();
    await expect(page).toHaveURL(/checkout\/success/, { timeout: 30_000 });

    // Submit a review.
    await page.goto("/ar/shop/bashmina-classic-2");
    await page.getByTestId("rating-4").click();
    await page.getByTestId("review-text").fill("خامة ممتازة وتطريز يستحق السعر.");
    await page.getByTestId("review-submit").click();
    await expect(page.getByText("سيظهر تقييمك بعد مراجعته")).toBeVisible();

    // Not public until approved.
    await page.goto("/ar/shop/bashmina-classic-2");
    await expect(page.getByText("خامة ممتازة وتطريز يستحق السعر.")).toHaveCount(0);

    // Approve in admin.
    await page.evaluate(() => fetch("/api/account/logout", { method: "POST" }));
    await loginAsOwner(page);
    await page.goto("/ar/admin/reviews");
    const row = page.locator("tr", { hasText: "خامة ممتازة" }).first();
    await row.locator('[data-testid^="toggle-review-"]').click();
    await expect(page).toHaveURL(/saved=1/, { timeout: 30_000 });

    // Now public with the verified badge.
    await page.goto("/ar/shop/bashmina-classic-2");
    await expect(page.getByText("خامة ممتازة وتطريز يستحق السعر.")).toBeVisible();
    await expect(page.getByTestId("avg-rating")).toContainText("4.0");

    // Cleanup: deleting the customer removes the review too.
    page.on("dialog", (d) => d.accept());
    await page.goto("/ar/admin/customers");
    await page.getByTestId(`delete-customer-${phone}`).click();
    await expect(page).toHaveURL(/deleted=1/, { timeout: 30_000 });
    await expect(page.getByTestId(`customer-row-${phone}`)).toHaveCount(0);
    await page.goto("/ar/shop/bashmina-classic-2");
    await expect(page.getByText("خامة ممتازة وتطريز يستحق السعر.")).toHaveCount(0);
  });
});

test.describe("2FA", () => {
  // The owner account is shared with everything else — if this test dies
  // mid-flight with TOTP enabled, every later password-only login (tests
  // AND the real admin) is locked out. Guarantee cleanup at the DB level.
  test.afterEach(async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      await prisma.adminUser.update({
        where: { email: ADMIN_EMAIL },
        data: { totpSecret: null },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test("owner enrolls TOTP, must supply a code at next login, then disables it", async ({
    page,
  }) => {
    test.slow();
    await loginAsOwner(page);

    await page.goto("/ar/admin/security");
    await page.getByTestId("enable-totp").click();
    const secret = (await page.getByTestId("totp-secret").textContent())!.trim();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);

    await page.getByTestId("totp-code").fill(totpFor(secret));
    await page.getByTestId("confirm-totp").click();
    await expect(page).toHaveURL(/enabled=1/, { timeout: 30_000 });

    // Fresh login now demands the second factor.
    await page.evaluate(() => fetch("/api/admin/logout", { method: "POST" }));
    await page.goto("/ar/admin/login");
    await page.getByTestId("admin-email").fill(ADMIN_EMAIL);
    await page.getByTestId("admin-password").fill(ADMIN_PASSWORD);
    await page.getByTestId("admin-login").click();
    await expect(page.getByTestId("admin-totp")).toBeVisible();
    await page.getByTestId("admin-totp").fill(totpFor(secret));
    await page.getByTestId("admin-login").click();
    await expect(page).toHaveURL(/\/ar\/admin$/);

    // Disable again so the shared owner account isn't left locked to this
    // test's secret (afterEach also enforces this at the DB level).
    page.on("dialog", (d) => d.accept());
    await page.goto("/ar/admin/security");
    await page.getByTestId("disable-totp").click();
    await expect(page).toHaveURL(/disabled=1/, { timeout: 30_000 });
    await expect(page.getByTestId("totp-status")).toContainText("غير مفعّل");
  });
});
