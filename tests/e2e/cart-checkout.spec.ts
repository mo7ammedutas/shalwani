import { expect, test } from "@playwright/test";

test.describe("cart", () => {
  test("adds a product, updates quantities and totals", async ({ page }) => {
    await page.goto("/ar/shop/super-turma"); // 25.000 OMR, stock 10
    await page.getByTestId("add-to-cart").click();

    // Drawer opens with the item
    const drawer = page.getByTestId("cart-drawer");
    await expect(drawer).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await expect(page.getByTestId("cart-subtotal")).toContainText("25.000");

    // Increase quantity → subtotal doubles
    await drawer.getByRole("button", { name: "زد الكمية" }).click();
    await expect(page.getByTestId("qty-super-turma")).toHaveText("2");
    await expect(page.getByTestId("cart-subtotal")).toContainText("50.000");
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    // Cart survives a reload (localStorage)
    await page.reload();
    await page.getByTestId("cart-button").click();
    await expect(page.getByTestId("cart-subtotal")).toContainText("50.000");

    // Remove the line → empty state
    await page.getByTestId("cart-drawer").getByRole("button", { name: "احذف" }).click();
    await expect(page.getByTestId("cart-drawer")).toContainText("سلتك خالية بعد");
  });

  test("full cart page mirrors the drawer", async ({ page }) => {
    await page.goto("/ar/shop/bashmina-classic-1"); // 30.000 OMR (offer price)
    await page.getByTestId("add-to-cart").click();
    await page.getByRole("button", { name: "أغلق السلة" }).click();
    await page.goto("/ar/cart");
    await expect(page.getByTestId("cart-page-subtotal")).toContainText("30.000");
    await expect(page.getByTestId("to-checkout")).toBeVisible();
  });
});

test.describe("checkout → Thawani (mock sandbox)", () => {
  test("completes the flow to a confirmed order", async ({ page }) => {
    await page.goto("/ar/shop/bashmina-classic-2"); // 39.000 OMR (offer price)
    await page.getByTestId("add-to-cart").click();
    await page.getByTestId("drawer-checkout").click();
    await expect(page).toHaveURL(/\/ar\/checkout$/);
    await expect(page.getByTestId("checkout-total")).toContainText("39.000");

    await page.getByTestId("checkout-name").fill("سالم بن سعيد الهنائي");
    await page.getByTestId("checkout-phone").fill("96891111111");
    await page.getByTestId("checkout-address").fill("مسقط، الموالح الجنوبية، قرب المسجد");
    await page.getByTestId("pay-now").click();

    // Mock mode skips the hosted page and lands on success, where the
    // server verifies the session and confirms the order.
    await expect(page).toHaveURL(/checkout\/success\?order=SHW-/, { timeout: 30_000 });
    await expect(page.getByTestId("success-title")).toBeVisible();
    const orderNumber = await page.getByTestId("order-number").textContent();
    expect(orderNumber).toMatch(/^SHW-[A-Z0-9]+$/);

    // Cart is cleared after confirmed payment
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("shalwani-cart-v1")))
      .toBe("[]");
  });

  test("validates the form before creating a session", async ({ page }) => {
    await page.goto("/ar/shop/bashmina-vip-1");
    await page.getByTestId("add-to-cart").click();
    await page.getByTestId("drawer-checkout").click();
    await page.getByTestId("pay-now").click();
    await expect(page).toHaveURL(/\/ar\/checkout$/); // still here
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("checkout API re-prices on the server and confirms via verify", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        locale: "en",
        customer: { name: "Salim Al Hinai", phone: "96892222222", email: "" },
        address: "Muscat, Al Khoudh",
        items: [{ slug: "bashmina-vip-2", quantity: 1 }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const { redirectUrl, orderNumber } = await res.json();
    expect(orderNumber).toMatch(/^SHW-/);
    expect(redirectUrl).toContain(`order=${orderNumber}`);

    const verify = await request.get(`/api/checkout/verify?order=${orderNumber}`);
    expect(verify.ok()).toBeTruthy();
    const body = await verify.json();
    expect(body.status).toBe("paid");
  });

  test("checkout API rejects unknown products and bad input", async ({ request }) => {
    const bad = await request.post("/api/checkout", {
      data: {
        locale: "ar",
        customer: { name: "س", phone: "1", email: "" },
        address: "",
        items: [],
      },
    });
    expect(bad.status()).toBe(400);

    const unknown = await request.post("/api/checkout", {
      data: {
        locale: "ar",
        customer: { name: "سالم الهنائي", phone: "96893333333", email: "" },
        address: "مسقط",
        items: [{ slug: "no-such-product", quantity: 1 }],
      },
    });
    expect(unknown.status()).toBe(400);
  });

  test("out-of-stock products cannot be ordered", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        locale: "ar",
        customer: { name: "سالم الهنائي", phone: "96894444444", email: "" },
        address: "مسقط",
        items: [{ slug: "sanjin-vvip", quantity: 1 }], // seeded with stock 0 (sold out)
      },
    });
    expect(res.status()).toBe(409);
  });
});
