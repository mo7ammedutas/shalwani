import { expect, test } from "@playwright/test";

function uniquePhone(): string {
  return "9" + Math.floor(1000000 + Math.random() * 8999999);
}

test.describe("customer accounts", () => {
  test("registers, wishlists a product, logs out and back in", async ({ page }) => {
    const phone = uniquePhone();

    await page.goto("/ar/account/register");
    await page.getByTestId("register-name").fill("عميل الاختبار");
    await page.getByTestId("register-phone").fill(phone);
    await page.getByTestId("register-password").fill("testpass123");
    await page.getByTestId("register-submit").click();
    await expect(page).toHaveURL(/\/ar\/account$/);
    await expect(page.getByText("طلباتي")).toBeVisible();

    // wishlist a product from its detail page — wait for the toggle's
    // fetch to actually persist before navigating away, since the UI
    // updates optimistically ahead of the network round-trip.
    await page.goto("/ar/shop/bashmina-classic-1");
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/account/wishlist") && r.ok()),
      page.getByTestId("wishlist-toggle").click(),
    ]);
    await expect(page.getByTestId("wishlist-toggle")).toHaveAttribute("aria-pressed", "true");

    await page.goto("/ar/account");
    await expect(page.getByText("مصار الباشمينا — الفئة الأولى")).toBeVisible();

    // logout redirects a subsequent /account visit to login
    await page.evaluate(() => fetch("/api/account/logout", { method: "POST" }));
    await page.goto("/ar/account");
    await expect(page).toHaveURL(/\/ar\/account\/login$/);

    // and back in
    await page.getByTestId("login-phone").fill(phone);
    await page.getByTestId("login-password").fill("testpass123");
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/ar\/account$/);
    await expect(page.getByText("مصار الباشمينا — الفئة الأولى")).toBeVisible(); // wishlist persisted
  });

  test("checkout links a paid order to the logged-in account", async ({ page }) => {
    const phone = uniquePhone();
    await page.goto("/ar/account/register");
    await page.getByTestId("register-name").fill("عميل الطلبات");
    await page.getByTestId("register-phone").fill(phone);
    await page.getByTestId("register-password").fill("testpass123");
    await page.getByTestId("register-submit").click();
    await expect(page).toHaveURL(/\/ar\/account$/);

    await page.goto("/ar/shop/super-turma");
    await page.getByTestId("add-to-cart").click();
    await page.goto("/ar/checkout");
    // contact fields are pre-filled from the account
    await expect(page.getByTestId("checkout-phone")).toHaveValue(phone);
    await page.getByTestId("checkout-address").fill("مسقط، روي");
    await page.getByTestId("pay-now").click();
    await expect(page).toHaveURL(/checkout\/success/, { timeout: 20_000 });

    await page.goto("/ar/account");
    await expect(page.getByText("مصار سوبر تورمة")).toBeVisible();
    await expect(page.getByTestId("reorder-button").first()).toBeVisible();
  });

  test("account pages require sign-in", async ({ page }) => {
    await page.goto("/ar/account");
    await expect(page).toHaveURL(/\/ar\/account\/login$/);
  });
});
