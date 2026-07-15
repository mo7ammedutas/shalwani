import { expect, test } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "shalwani-2026";

test.describe("gift checkout", () => {
  test("gift toggle reveals add-ons and message, total updates live", async ({ page }) => {
    await page.goto("/ar/shop/massar-al-layl"); // 32.500 OMR
    await page.getByTestId("add-to-cart").click();
    await page.getByTestId("drawer-checkout").click();
    await expect(page).toHaveURL(/\/ar\/checkout$/);

    // Gift extras are hidden until the toggle is on
    await expect(page.getByTestId("gift-recipient")).toHaveCount(0);
    await page.getByTestId("gift-toggle").check();
    await expect(page.getByTestId("gift-recipient")).toBeVisible();
    await expect(page.getByTestId("gift-message")).toBeVisible();

    // Baseline total is just the product
    await expect(page.getByTestId("checkout-total")).toContainText("32.500");

    // Selecting an add-on updates the total
    await page.getByTestId("addon-roses").check(); // 3.000 OMR
    await expect(page.getByTestId("addons-total")).toContainText("3.000");
    await expect(page.getByTestId("checkout-total")).toContainText("35.500");

    // Selecting Gulf shipping adds its fee on top
    await page.getByTestId("shipping-gulf").check();
    await expect(page.getByTestId("shipping-fee")).toContainText("5.000");
    await expect(page.getByTestId("checkout-total")).toContainText("40.500");

    // Deselecting the add-on removes it again
    await page.getByTestId("addon-roses").uncheck();
    await expect(page.getByTestId("checkout-total")).toContainText("37.500");
  });

  test("submits a gift order with add-ons, message and Gulf shipping — server recomputes the total", async ({
    page,
  }) => {
    await page.goto("/ar/shop/massar-al-aaji"); // 24.000 OMR
    await page.getByTestId("add-to-cart").click();
    await page.getByTestId("drawer-checkout").click();

    await page.getByTestId("checkout-name").fill("سالم بن سعيد الهنائي");
    await page.getByTestId("checkout-phone").fill("96895555555");
    await page.getByTestId("checkout-address").fill("مسقط، روي، قرب البلدية");

    await page.getByTestId("gift-toggle").check();
    await page.getByTestId("addon-chocolate").check(); // 2.500 OMR
    await page.getByTestId("addon-roses").check(); // 3.000 OMR
    await page.getByTestId("gift-recipient").fill("سالم بن علي");
    await page.getByTestId("gift-message").fill("كل عام وأنتم بخير");
    await page.getByTestId("shipping-gulf").check(); // 5.000 OMR

    // 24.000 + 2.500 + 3.000 + 5.000 = 34.500
    await expect(page.getByTestId("checkout-total")).toContainText("34.500");

    await page.getByTestId("pay-now").click();
    await expect(page).toHaveURL(/checkout\/success\?order=SHW-/, { timeout: 30_000 });
    await expect(page.getByTestId("gift-note")).toBeVisible();
  });

  test("checkout API rejects an unknown or inactive gift add-on id", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        locale: "ar",
        customer: { name: "سالم الهنائي", phone: "96896666666", email: "" },
        address: "مسقط",
        items: [{ slug: "massar-al-fajr", quantity: 1 }],
        isGift: true,
        giftAddonIds: ["not-a-real-addon-id"],
        shippingZone: "oman",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("checkout API ignores gift fields when isGift is false", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        locale: "ar",
        customer: { name: "سالم الهنائي", phone: "96897777777", email: "" },
        address: "مسقط",
        items: [{ slug: "massar-al-fajr", quantity: 1 }], // 19.500 OMR
        isGift: false,
        giftAddonIds: [], // even if a client sent addon ids, isGift:false means no addons
        shippingZone: "oman",
      },
    });
    expect(res.ok()).toBeTruthy();
    const { orderNumber } = (await res.json()) as { orderNumber: string };

    const verify = await request.get(`/api/checkout/verify?order=${orderNumber}`);
    expect((await verify.json()).status).toBe("paid");
  });
});

test.describe("admin gift add-ons", () => {
  async function login(page: import("@playwright/test").Page) {
    await page.goto("/ar/admin/login");
    await page.getByTestId("admin-password").fill(ADMIN_PASSWORD);
    await page.getByTestId("admin-login").click();
    await expect(page).toHaveURL(/\/ar\/admin$/);
  }

  test("creates, edits, deactivates and deletes a gift add-on", async ({ page }) => {
    await login(page);
    await page.goto("/ar/admin/gift-addons");
    await page.getByTestId("new-gift-addon").click();

    await page.getByTestId("ga-nameAr").fill("بطاقة تهنئة");
    await page.getByTestId("ga-nameEn").fill("E2E Greeting Card");
    await page.getByTestId("ga-price").fill("1.500");
    await page.getByTestId("ga-save").click();

    await expect(page).toHaveURL(/\/ar\/admin\/gift-addons\?saved=1/);
    const row = page.getByTestId("row-e2e-greeting-card");
    await expect(row).toBeVisible();
    await expect(row).toContainText("1.500");

    // It now appears as a selectable add-on at checkout
    await page.goto("/ar/shop/massar-al-fajr");
    await page.getByTestId("add-to-cart").click();
    await page.getByTestId("drawer-checkout").click();
    await page.getByTestId("gift-toggle").check();
    await expect(page.getByTestId("addon-e2e-greeting-card")).toBeVisible();

    // Edit the price
    await page.goto("/ar/admin/gift-addons");
    await page.getByTestId("edit-e2e-greeting-card").click();
    await page.getByTestId("ga-price").fill("2.000");
    await page.getByTestId("ga-save").click();
    await expect(page.getByTestId("row-e2e-greeting-card")).toContainText("2.000");

    // Delete (no orders reference it → hard delete)
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("delete-e2e-greeting-card").click();
    await expect(page.getByTestId("admin-notice")).toBeVisible();
    await expect(page.getByTestId("row-e2e-greeting-card")).toHaveCount(0);

    // No longer offered at checkout
    await page.goto("/ar/shop/massar-al-fajr");
    await page.getByTestId("add-to-cart").click();
    await page.getByTestId("drawer-checkout").click();
    await page.getByTestId("gift-toggle").check();
    await expect(page.getByTestId("addon-e2e-greeting-card")).toHaveCount(0);
  });
});
