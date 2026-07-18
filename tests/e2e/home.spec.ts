import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("home page", () => {
  test("loads in Arabic (RTL) by default", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("hero-shop-cta")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("فخامتك تبدأ من هنا");
  });

  test("shows the featured collection with prices in OMR", async ({ page }) => {
    await page.goto("/ar");
    const cards = page.getByTestId("product-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    await expect(cards.first()).toContainText("ر.ع");
  });

  test("has no serious accessibility violations", async ({ page }) => {
    await page.goto("/ar");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test.describe("language switcher", () => {
  // The switcher's accessible name is its aria-label, not the visible text.
  const toEnglish = "التبديل إلى الإنجليزية";
  const toArabic = "Switch to Arabic";

  test("flips the whole document to English LTR and back", async ({ page }) => {
    await page.goto("/ar");
    await page.getByRole("banner").getByRole("link", { name: toEnglish }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your elegance starts here");

    await page.getByRole("banner").getByRole("link", { name: toArabic }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("keeps the current page when switching language", async ({ page }) => {
    await page.goto("/ar/shop/bashmina-classic-1");
    await page.getByRole("banner").getByRole("link", { name: toEnglish }).click();
    await expect(page).toHaveURL(/\/en\/shop\/bashmina-classic-1$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pashmina Massar");
  });
});
