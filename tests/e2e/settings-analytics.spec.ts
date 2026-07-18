import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "owner@shalwani.om";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "shalwani-2026";

async function loginAsOwner(page: import("@playwright/test").Page) {
  await page.goto("/ar/admin/login");
  await page.getByTestId("admin-email").fill(ADMIN_EMAIL);
  await page.getByTestId("admin-password").fill(ADMIN_PASSWORD);
  await page.getByTestId("admin-login").click();
  await expect(page).toHaveURL(/\/ar\/admin$/);
}

test.describe("settings", () => {
  test("accent preset and gulf shipping fee apply to the storefront and checkout", async ({
    page,
  }) => {
    await loginAsOwner(page);
    // Everything that mutates shared settings lives inside try/finally —
    // if any assertion here fails, the finally block still restores the
    // defaults instead of leaking the test values into other test files.
    try {
      await page.goto("/ar/admin/settings");
      await page.getByTestId("accent-emerald").check({ force: true });
      await page.getByTestId("settings-gulf-fee").fill("9.000");
      await page.getByTestId("settings-save").click();
      await expect(page).toHaveURL(/saved=1/);

      await page.goto("/ar");
      const accent = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim(),
      );
      expect(accent.toLowerCase()).toBe("#1f4a38"); // ACCENT_PRESETS.emerald.accent

      await page.goto("/ar/shop/super-turma");
      await page.getByTestId("add-to-cart").click();
      await page.goto("/ar/checkout");
      await page.getByTestId("shipping-gulf").check({ force: true });
      await expect(page.getByTestId("shipping-fee")).toContainText("9.000");
    } finally {
      // Restore defaults — this settings table is shared with the live site.
      await page.goto("/ar/admin/settings");
      await page.getByTestId("accent-midnight").check({ force: true });
      await page.getByTestId("settings-gulf-fee").fill("5.000");
      await page.getByTestId("settings-vat-rate").fill("0");
      await page.getByTestId("settings-save").click();
      await expect(page).toHaveURL(/saved=1/);
    }
  });

  test("settings page requires the settings permission", async ({ page }) => {
    await page.goto("/ar/admin/settings");
    await expect(page).toHaveURL(/\/ar\/admin\/login$/);
  });
});

test.describe("analytics", () => {
  test("dashboard renders revenue, top products and low-stock sections", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/ar/admin/analytics");
    await expect(page.getByTestId("revenue-chart")).toBeVisible();
    await expect(page.getByText("الإيرادات").first()).toBeVisible();
    await expect(page.getByText("متوسط قيمة الطلب")).toBeVisible();
    await expect(page.getByText("معدّل التحويل")).toBeVisible();
    await expect(page.getByText("الأكثر مبيعاً")).toBeVisible();
    await expect(page.getByText("أفضل العملاء")).toBeVisible();
    await expect(page.getByText("مخزون منخفض")).toBeVisible();
  });
});
