import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("shop filtering and sorting", () => {
  test("filters by color", async ({ page }) => {
    await page.goto("/ar/shop");
    const initial = await page.getByTestId("product-card").count();
    expect(initial).toBeGreaterThanOrEqual(10);

    await page.getByTestId("filter-color").selectOption("ivory");
    await expect(page).toHaveURL(/color=ivory/);
    await expect(page.getByTestId("product-card")).toHaveCount(2);
    await expect(page.getByTestId("result-count")).toContainText("2");
  });

  test("filters by embroidery and price bucket together", async ({ page }) => {
    await page.goto("/ar/shop");
    await page.getByTestId("filter-embroidery").selectOption("kashmiri");
    await expect(page.getByTestId("product-card")).toHaveCount(3);

    await page.getByTestId("filter-price").selectOption("over40");
    await expect(page.getByTestId("product-card")).toHaveCount(3);

    await page.getByTestId("filter-color").selectOption("lazuli");
    await expect(page.getByTestId("product-card")).toHaveCount(1);
  });

  test("sorts by price ascending", async ({ page }) => {
    await page.goto("/ar/shop");
    await page.getByTestId("filter-sort").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
    const prices = await page
      .getByTestId("product-card")
      .locator(".tabular")
      .allTextContents();
    const numbers = prices.map((p) => parseFloat(p.replace(/[^\d.]/g, "")));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  test("shop page has no serious accessibility violations", async ({ page }) => {
    await page.goto("/ar/shop");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
