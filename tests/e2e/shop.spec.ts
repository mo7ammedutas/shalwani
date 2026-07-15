import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("shop filtering and sorting", () => {
  // The merchant adds real products to the same database, so these tests
  // assert filter CORRECTNESS (every visible card matches) rather than
  // exact counts, plus a floor from the seeded catalogue.
  test("filters by color", async ({ page }) => {
    await page.goto("/ar/shop");
    const initial = await page.getByTestId("product-card").count();
    expect(initial).toBeGreaterThanOrEqual(10);

    await page.getByTestId("filter-color").selectOption("ivory");
    await expect(page).toHaveURL(/color=ivory/);
    const cards = page.getByTestId("product-card");
    // selectOption triggers a soft navigation — poll until the rendered
    // cards actually reflect the filter.
    await expect
      .poll(async () => {
        const texts = await cards.allTextContents();
        return texts.length >= 2 && texts.every((t) => t.includes("عاجي"));
      })
      .toBe(true);
    expect(await cards.count()).toBeLessThan(initial);
  });

  test("filters by embroidery and price bucket together", async ({ page }) => {
    await page.goto("/ar/shop");
    await page.getByTestId("filter-embroidery").selectOption("kashmiri");
    const cards = page.getByTestId("product-card");
    await expect
      .poll(async () => {
        const texts = await cards.allTextContents();
        // seeded kashmiri pieces = 3, all cards must match the filter
        return texts.length >= 3 && texts.every((t) => t.includes("تطريز كشميري"));
      })
      .toBe(true);

    // Each selection triggers a soft navigation that rebuilds the URL from
    // useSearchParams — wait for it to land before stacking the next filter,
    // or the later one reads stale params and drops the earlier one.
    await page.getByTestId("filter-price").selectOption("over40");
    await expect(page).toHaveURL(/price=over40/);
    await page.getByTestId("filter-color").selectOption("lazuli");
    await expect(page).toHaveURL(/color=lazuli/);

    // The seeded lazuli kashmiri piece over 40 OMR must survive the stack
    await expect
      .poll(
        async () => {
          const texts = await cards.allTextContents();
          return (
            texts.length >= 1 &&
            texts.some((t) => t.includes("مَصَر اللازورد")) &&
            texts.every((t) => t.includes("أزرق لازوردي") && t.includes("تطريز كشميري"))
          );
        },
        { timeout: 15_000 },
      )
      .toBe(true);
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
