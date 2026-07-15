import { expect, test } from "@playwright/test";

// Matches the dev/test value in .env; override via env when running elsewhere.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "shalwani-2026";

// 1×1 transparent PNG for upload tests
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function login(page: import("@playwright/test").Page) {
  await page.goto("/ar/admin/login");
  await page.getByTestId("admin-password").fill(ADMIN_PASSWORD);
  await page.getByTestId("admin-login").click();
  await expect(page).toHaveURL(/\/ar\/admin$/);
}

test.describe("admin panel", () => {
  test("is locked behind the password", async ({ page }) => {
    await page.goto("/ar/admin");
    await expect(page).toHaveURL(/\/ar\/admin\/login$/);

    await page.getByTestId("admin-password").fill("wrong-password");
    await page.getByTestId("admin-login").click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/ar\/admin\/login$/);
  });

  test("creates, edits and deletes a product end-to-end", async ({ page }) => {
    await login(page);

    // ── create ──
    await page.getByTestId("new-product").click();
    await expect(page).toHaveURL(/\/ar\/admin\/products\/new$/);

    await page.getByTestId("pf-nameAr").fill("مَصَر الاختبار");
    await page.getByTestId("pf-nameEn").fill("The E2E Test Massar");
    await page.getByTestId("pf-descAr").fill("وصف تجريبي للاختبار الآلي.");
    await page.getByTestId("pf-descEn").fill("Automated test description.");
    await page.getByTestId("pf-price").fill("21.500");
    await page.getByTestId("pf-stock").fill("4");
    await page.setInputFiles('input[type="file"]', {
      name: "test.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    // next/image rewrites the src through /_next/image?url=%2Fuploads%2F…
    await expect(page.locator('img[src*="uploads"]').first()).toBeVisible();
    await page.getByTestId("pf-save").click();

    await expect(page).toHaveURL(/\/ar\/admin\?saved=1/);
    const row = page.getByTestId("row-the-e2e-test-massar");
    await expect(row).toBeVisible();
    await expect(row).toContainText("21.500");

    // ── live on the storefront ──
    await page.goto("/ar/shop");
    await expect(page.getByText("مَصَر الاختبار")).toBeVisible();

    // ── edit price ──
    await page.goto("/ar/admin");
    await page.getByTestId("edit-the-e2e-test-massar").click();
    await page.getByTestId("pf-price").fill("25.000");
    await page.getByTestId("pf-save").click();
    await expect(page).toHaveURL(/\/ar\/admin\?saved=1/);
    await expect(page.getByTestId("row-the-e2e-test-massar")).toContainText("25.000");

    // ── delete (no orders → hard delete) ──
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("delete-the-e2e-test-massar").click();
    await expect(page.getByTestId("admin-notice")).toBeVisible();
    await expect(page.getByTestId("row-the-e2e-test-massar")).toHaveCount(0);

    // gone from the storefront too
    await page.goto("/ar/shop");
    await expect(page.getByText("مَصَر الاختبار")).toHaveCount(0);
  });

  test("upload API rejects unauthenticated requests", async ({ request }) => {
    const res = await request.post("/api/admin/upload", {
      multipart: { file: { name: "x.png", mimeType: "image/png", buffer: PNG } },
    });
    expect(res.status()).toBe(401);
  });
});
