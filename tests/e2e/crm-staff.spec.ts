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

test.describe("CRM", () => {
  test("shows a customer created via checkout and saves a note", async ({ page, request }) => {
    const phone = "9" + Math.floor(1000000 + Math.random() * 8999999);
    const res = await request.post("/api/checkout", {
      data: {
        locale: "ar",
        customer: { name: "عميل CRM", phone, email: "" },
        address: "مسقط",
        items: [{ slug: "bashmina-classic-2", quantity: 1 }],
      },
    });
    expect(res.ok()).toBeTruthy();

    await loginAsOwner(page);
    await page.goto("/ar/admin/customers");
    const row = page.getByTestId(`customer-row-${phone}`);
    await expect(row).toBeVisible();
    await expect(row).toContainText("عميل CRM");

    await row.locator("a").click();
    await page.getByTestId("customer-notes").fill("عميل مهتم بالتطريز الكشميري");
    await page.getByTestId("save-notes").click();
    await expect(page).toHaveURL(/saved=1/);
    await expect(page.getByTestId("customer-notes")).toHaveValue("عميل مهتم بالتطريز الكشميري");

    // deleting from the detail page removes the customer and their order
    page.on("dialog", (d) => d.accept());
    await page.getByTestId("delete-customer").click();
    await expect(page).toHaveURL(/\/ar\/admin\/customers\?deleted=1/);
    await expect(page.getByTestId(`customer-row-${phone}`)).toHaveCount(0);
  });

  test("deletes a customer directly from the list", async ({ page, request }) => {
    const phone = "9" + Math.floor(1000000 + Math.random() * 8999999);
    const res = await request.post("/api/checkout", {
      data: {
        locale: "ar",
        customer: { name: "عميل للحذف", phone, email: "" },
        address: "مسقط",
        items: [{ slug: "super-turma", quantity: 1 }],
      },
    });
    expect(res.ok()).toBeTruthy();

    await loginAsOwner(page);
    await page.goto("/ar/admin/customers");
    page.on("dialog", (d) => d.accept());
    await page.getByTestId(`delete-customer-${phone}`).click();
    await expect(page.getByTestId("admin-notice")).toBeVisible();
    await expect(page.getByTestId(`customer-row-${phone}`)).toHaveCount(0);
  });
});

test.describe("staff roles", () => {
  const staffEmail = `staff-${Date.now()}@shalwani.om`;

  test("owner creates a warehouse-role account with restricted access", async ({ page }) => {
    await loginAsOwner(page);

    await page.goto("/ar/admin/staff/new");
    await page.getByTestId("sf-name").fill("موظف المستودع");
    await page.getByTestId("sf-email").fill(staffEmail);
    await page.getByTestId("sf-password").fill("warehousepass123");
    await page.getByTestId("sf-role").selectOption("warehouse");
    await page.getByTestId("sf-save").click();
    await expect(page).toHaveURL(/\/ar\/admin\/staff\?saved=1/);
    await expect(page.getByTestId(`staff-row-${staffEmail}`)).toBeVisible();

    // sign out of the owner session, in as the new warehouse account
    await page.evaluate(() => fetch("/api/admin/logout", { method: "POST" }));
    await page.goto("/ar/admin/login");
    await page.getByTestId("admin-email").fill(staffEmail);
    await page.getByTestId("admin-password").fill("warehousepass123");
    await page.getByTestId("admin-login").click();
    await expect(page).toHaveURL(/\/ar\/admin$/);

    // warehouse can reach products + orders...
    await expect(page.getByRole("link", { name: "المنتجات" })).toBeVisible();
    await expect(page.getByRole("link", { name: "الطلبات" })).toBeVisible();
    // ...but not customers, staff, settings or analytics
    await expect(page.getByRole("link", { name: "العملاء" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "الموظفون" })).toHaveCount(0);

    // direct URL access to a section outside the role is redirected away
    await page.goto("/ar/admin/staff");
    await expect(page).toHaveURL(/\/ar\/admin$/);
    await page.goto("/ar/admin/settings");
    await expect(page).toHaveURL(/\/ar\/admin$/);

    // clean up: sign back in as owner and delete the test account
    await page.evaluate(() => fetch("/api/admin/logout", { method: "POST" }));
    await loginAsOwner(page);
    await page.goto("/ar/admin/staff");
    page.on("dialog", (d) => d.accept());
    await page.getByTestId(`delete-staff-${staffEmail}`).click();
    await expect(page.getByTestId(`staff-row-${staffEmail}`)).toHaveCount(0);
  });
});
