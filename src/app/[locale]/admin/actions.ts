"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePerm } from "@/lib/admin-guard";
import { hashPassword } from "@/lib/password";
import { isRole } from "@/lib/roles";
import { omrToBaisa } from "@/lib/money";

const productSchema = z.object({
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120),
  descriptionAr: z.string().trim().min(2).max(2000),
  descriptionEn: z.string().trim().min(2).max(2000),
  color: z.string().trim().min(1).max(40),
  embroidery: z.string().trim().min(1).max(40),
  priceOmr: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,3})?$/),
  originalPriceOmr: z
    .string()
    .trim()
    .regex(/^\d*(\.\d{1,3})?$/)
    .optional(),
  stock: z.coerce.number().int().min(0).max(9999),
  featured: z.boolean(),
  archived: z.boolean(),
  images: z.array(z.string().trim().min(1).max(500)).min(1).max(8),
});

function parseForm(formData: FormData) {
  let images: string[] = [];
  try {
    images = JSON.parse(String(formData.get("images") ?? "[]")) as string[];
  } catch {
    images = [];
  }
  return productSchema.safeParse({
    nameAr: formData.get("nameAr"),
    nameEn: formData.get("nameEn"),
    descriptionAr: formData.get("descriptionAr"),
    descriptionEn: formData.get("descriptionEn"),
    color: formData.get("color"),
    embroidery: formData.get("embroidery"),
    priceOmr: formData.get("priceOmr"),
    originalPriceOmr: String(formData.get("originalPriceOmr") ?? ""),
    stock: formData.get("stock"),
    featured: formData.get("featured") === "on",
    archived: formData.get("archived") === "on",
    images,
  });
}

function slugify(nameEn: string): string {
  return (
    nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "piece"
  );
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function refresh() {
  // Storefront + admin all read the same rows.
  revalidatePath("/", "layout");
}

export async function createProduct(locale: string, formData: FormData) {
  await requirePerm(locale, "products.write");
  const parsed = parseForm(formData);
  if (!parsed.success) redirect(`/${locale}/admin/products/new?error=1`);
  const data = parsed.data;

  await prisma.product.create({
    data: {
      slug: await uniqueSlug(slugify(data.nameEn)),
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      descriptionAr: data.descriptionAr,
      descriptionEn: data.descriptionEn,
      color: data.color,
      embroidery: data.embroidery,
      priceBaisa: omrToBaisa(parseFloat(data.priceOmr)),
      originalPriceBaisa: data.originalPriceOmr
        ? omrToBaisa(parseFloat(data.originalPriceOmr))
        : null,
      stock: data.stock,
      featured: data.featured,
      archived: data.archived,
      images: JSON.stringify(data.images),
    },
  });
  refresh();
  redirect(`/${locale}/admin?saved=1`);
}

export async function updateProduct(locale: string, id: string, formData: FormData) {
  await requirePerm(locale, "products.write");
  const parsed = parseForm(formData);
  if (!parsed.success) redirect(`/${locale}/admin/products/${id}?error=1`);
  const data = parsed.data;

  await prisma.product.update({
    where: { id },
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      descriptionAr: data.descriptionAr,
      descriptionEn: data.descriptionEn,
      color: data.color,
      embroidery: data.embroidery,
      priceBaisa: omrToBaisa(parseFloat(data.priceOmr)),
      originalPriceBaisa: data.originalPriceOmr
        ? omrToBaisa(parseFloat(data.originalPriceOmr))
        : null,
      stock: data.stock,
      featured: data.featured,
      archived: data.archived,
      images: JSON.stringify(data.images),
    },
  });
  refresh();
  redirect(`/${locale}/admin?saved=1`);
}

/** Hard-deletes when possible; archives instead when order history exists.
 * redirect() throws internally, so it stays outside the try/catch. */
export async function deleteProduct(locale: string, id: string) {
  await requirePerm(locale, "products.write");
  let outcome: "deleted" | "archived" = "deleted";
  try {
    await prisma.product.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2003" || err.code === "P2014")
    ) {
      await prisma.product.update({ where: { id }, data: { archived: true } });
      outcome = "archived";
    } else {
      throw err;
    }
  }
  refresh();
  redirect(`/${locale}/admin?${outcome}=1`);
}

export async function setArchived(locale: string, id: string, archived: boolean) {
  await requirePerm(locale, "products.write");
  await prisma.product.update({ where: { id }, data: { archived } });
  refresh();
  redirect(`/${locale}/admin?saved=1`);
}

/** Permanently removes an order with its line items, gift add-ons and
 * payment log. Stock is not restored — deletion is bookkeeping, not a refund. */
export async function deleteOrder(locale: string, id: string) {
  await requirePerm(locale, "orders.write");
  await prisma.$transaction([
    prisma.orderGiftAddon.deleteMany({ where: { orderId: id } }),
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.paymentTransaction.deleteMany({ where: { orderId: id } }),
    prisma.order.delete({ where: { id } }),
  ]);
  refresh();
  redirect(`/${locale}/admin/orders?deleted=1`);
}

// ── Gift add-ons ──────────────────────────────────────────────

const giftAddonSchema = z.object({
  nameAr: z.string().trim().min(1).max(80),
  nameEn: z.string().trim().min(1).max(80),
  priceOmr: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,3})?$/),
  active: z.boolean(),
});

function parseGiftAddonForm(formData: FormData) {
  return giftAddonSchema.safeParse({
    nameAr: formData.get("nameAr"),
    nameEn: formData.get("nameEn"),
    priceOmr: formData.get("priceOmr"),
    active: formData.get("active") === "on",
  });
}

function addonSlugify(nameEn: string): string {
  return (
    nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "addon"
  );
}

async function uniqueAddonSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const existing = await prisma.giftAddon.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createGiftAddon(locale: string, formData: FormData) {
  await requirePerm(locale, "giftAddons.write");
  const parsed = parseGiftAddonForm(formData);
  if (!parsed.success) redirect(`/${locale}/admin/gift-addons/new?error=1`);
  const data = parsed.data;

  await prisma.giftAddon.create({
    data: {
      slug: await uniqueAddonSlug(addonSlugify(data.nameEn)),
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      priceBaisa: omrToBaisa(parseFloat(data.priceOmr)),
      active: data.active,
    },
  });
  refresh();
  redirect(`/${locale}/admin/gift-addons?saved=1`);
}

export async function updateGiftAddon(locale: string, id: string, formData: FormData) {
  await requirePerm(locale, "giftAddons.write");
  const parsed = parseGiftAddonForm(formData);
  if (!parsed.success) redirect(`/${locale}/admin/gift-addons/${id}?error=1`);
  const data = parsed.data;

  await prisma.giftAddon.update({
    where: { id },
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      priceBaisa: omrToBaisa(parseFloat(data.priceOmr)),
      active: data.active,
    },
  });
  refresh();
  redirect(`/${locale}/admin/gift-addons?saved=1`);
}

/** Hard-deletes when possible; deactivates instead when order history exists. */
export async function deleteGiftAddon(locale: string, id: string) {
  await requirePerm(locale, "giftAddons.write");
  let outcome: "deleted" | "deactivated" = "deleted";
  try {
    await prisma.giftAddon.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2003" || err.code === "P2014")
    ) {
      await prisma.giftAddon.update({ where: { id }, data: { active: false } });
      outcome = "deactivated";
    } else {
      throw err;
    }
  }
  refresh();
  redirect(`/${locale}/admin/gift-addons?${outcome}=1`);
}

export async function setGiftAddonActive(locale: string, id: string, active: boolean) {
  await requirePerm(locale, "giftAddons.write");
  await prisma.giftAddon.update({ where: { id }, data: { active } });
  refresh();
  redirect(`/${locale}/admin/gift-addons?saved=1`);
}

// ── CRM ───────────────────────────────────────────────────────

export async function updateCustomerNotes(locale: string, id: string, formData: FormData) {
  await requirePerm(locale, "crm.write");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 4000);
  await prisma.customer.update({ where: { id }, data: { notes: notes || null } });
  refresh();
  redirect(`/${locale}/admin/customers/${id}?saved=1`);
}

/** Permanently removes a customer with every dependent record — orders
 * (items, gift add-ons, payment log), wishlist, account credentials.
 * Built for clearing test/junk profiles; the confirm dialog in the UI
 * spells out that order history goes with them. Stock is not restored. */
export async function deleteCustomer(locale: string, id: string) {
  await requirePerm(locale, "crm.write");

  const orders = await prisma.order.findMany({ where: { customerId: id }, select: { id: true } });
  const orderIds = orders.map((o) => o.id);

  await prisma.$transaction([
    prisma.orderGiftAddon.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.paymentTransaction.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.wishlistItem.deleteMany({ where: { customerId: id } }),
    prisma.review.deleteMany({ where: { customerId: id } }),
    prisma.loyaltyTransaction.deleteMany({ where: { customerId: id } }),
    prisma.customer.delete({ where: { id } }),
  ]);
  refresh();
  redirect(`/${locale}/admin/customers?deleted=1`);
}

// ── Staff ─────────────────────────────────────────────────────

const staffSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().max(200), // may be blank on edit (keep current)
  role: z.string(),
  active: z.boolean(),
});

function parseStaffForm(formData: FormData) {
  return staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password") ?? "",
    role: formData.get("role"),
    active: formData.get("active") === "on",
  });
}

export async function createStaff(locale: string, formData: FormData) {
  await requirePerm(locale, "staff.write");
  const parsed = parseStaffForm(formData);
  if (!parsed.success || !isRole(parsed.data.role) || parsed.data.password.length < 8) {
    redirect(`/${locale}/admin/staff/new?error=1`);
  }
  const data = parsed.data;

  const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
  if (existing) redirect(`/${locale}/admin/staff/new?error=email`);

  await prisma.adminUser.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashPassword(data.password),
      role: data.role,
      active: data.active,
    },
  });
  redirect(`/${locale}/admin/staff?saved=1`);
}

export async function updateStaff(locale: string, id: string, formData: FormData) {
  const me = await requirePerm(locale, "staff.write");
  const parsed = parseStaffForm(formData);
  if (!parsed.success || !isRole(parsed.data.role)) {
    redirect(`/${locale}/admin/staff/${id}?error=1`);
  }
  const data = parsed.data;

  if (id === me.id && (!data.active || data.role !== me.role)) {
    // Prevent locking yourself out: can't disable or demote your own account.
    redirect(`/${locale}/admin/staff/${id}?error=self`);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== id) redirect(`/${locale}/admin/staff/${id}?error=email`);

  if (data.password && data.password.length > 0 && data.password.length < 8) {
    redirect(`/${locale}/admin/staff/${id}?error=1`);
  }

  await prisma.adminUser.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
      ...(data.password ? { passwordHash: hashPassword(data.password) } : {}),
    },
  });
  redirect(`/${locale}/admin/staff?saved=1`);
}

export async function deleteStaff(locale: string, id: string) {
  const me = await requirePerm(locale, "staff.write");
  if (id === me.id) redirect(`/${locale}/admin/staff?error=self`);
  await prisma.adminUser.delete({ where: { id } });
  redirect(`/${locale}/admin/staff?deleted=1`);
}

export async function setStaffActive(locale: string, id: string, active: boolean) {
  const me = await requirePerm(locale, "staff.write");
  if (id === me.id && !active) redirect(`/${locale}/admin/staff?error=self`);
  await prisma.adminUser.update({ where: { id }, data: { active } });
  redirect(`/${locale}/admin/staff?saved=1`);
}

// ── Settings ──────────────────────────────────────────────────

// Keep in sync with dict.story.sections in src/lib/i18n/{ar,en}.ts.
const STORY_SECTION_COUNT = 5;

export async function updateSettings(locale: string, formData: FormData) {
  await requirePerm(locale, "settings.write");

  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const heroImageUrl = String(formData.get("heroImageUrl") ?? "").trim();
  const storyTeaserImageUrl = String(formData.get("storyTeaserImageUrl") ?? "").trim();
  const storyImageUrls = Array.from({ length: STORY_SECTION_COUNT }, (_, i) =>
    String(formData.get(`storyImageUrl${i}`) ?? "").trim(),
  );
  const accentPreset = String(formData.get("accentPreset") ?? "midnight");
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const whatsappUrl = String(formData.get("whatsappUrl") ?? "").trim();
  const vatRatePercent = String(formData.get("vatRatePercent") ?? "0").trim();
  const gulfShippingFeeOmr = String(formData.get("gulfShippingFeeOmr") ?? "").trim();
  const loyaltyPointsPerOmr = String(formData.get("loyaltyPointsPerOmr") ?? "1").trim();

  const entries: [string, string][] = [
    ["logoUrl", logoUrl],
    ["heroImageUrl", heroImageUrl],
    ["storyImageUrls", JSON.stringify(storyImageUrls)],
    ["storyTeaserImageUrl", storyTeaserImageUrl],
    ["accentPreset", accentPreset],
    ["contactEmail", contactEmail],
    ["whatsappUrl", whatsappUrl],
    ["vatRatePercent", vatRatePercent],
    ["gulfShippingFeeOmr", gulfShippingFeeOmr],
    ["loyaltyPointsPerOmr", loyaltyPointsPerOmr],
  ];

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  );
  refresh();
  redirect(`/${locale}/admin/settings?saved=1`);
}

// ── Coupons ───────────────────────────────────────────────────

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .transform((s) => s.toUpperCase().replace(/\s+/g, "")),
  kind: z.enum(["percent", "fixed", "freeShipping"]),
  value: z.coerce.number().int().min(0).max(1_000_000),
  minOrderOmr: z
    .string()
    .trim()
    .regex(/^\d*(\.\d{1,3})?$/)
    .optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional(), // yyyy-mm-dd from <input type="date">
  active: z.boolean(),
});

function parseCouponForm(formData: FormData) {
  return couponSchema.safeParse({
    code: formData.get("code"),
    kind: formData.get("kind"),
    value: formData.get("value") || "0",
    minOrderOmr: String(formData.get("minOrderOmr") ?? ""),
    maxUses: formData.get("maxUses") || undefined,
    expiresAt: String(formData.get("expiresAt") ?? ""),
    active: formData.get("active") === "on",
  });
}

function couponData(data: z.infer<typeof couponSchema>) {
  // Percent coupons cap at 100; fixed coupons store OMR-entered value as baisa.
  const value =
    data.kind === "percent"
      ? Math.min(data.value, 100)
      : data.kind === "fixed"
        ? omrToBaisa(data.value)
        : 0;
  return {
    code: data.code,
    kind: data.kind,
    value,
    minOrderBaisa: data.minOrderOmr ? omrToBaisa(parseFloat(data.minOrderOmr) || 0) : 0,
    maxUses: data.maxUses ?? null,
    expiresAt: data.expiresAt ? new Date(`${data.expiresAt}T23:59:59Z`) : null,
    active: data.active,
  };
}

export async function createCoupon(locale: string, formData: FormData) {
  await requirePerm(locale, "coupons.write");
  const parsed = parseCouponForm(formData);
  if (!parsed.success) redirect(`/${locale}/admin/coupons/new?error=1`);
  try {
    await prisma.coupon.create({ data: couponData(parsed.data) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      redirect(`/${locale}/admin/coupons/new?error=duplicate`);
    }
    throw err;
  }
  refresh();
  redirect(`/${locale}/admin/coupons?saved=1`);
}

export async function updateCoupon(locale: string, id: string, formData: FormData) {
  await requirePerm(locale, "coupons.write");
  const parsed = parseCouponForm(formData);
  if (!parsed.success) redirect(`/${locale}/admin/coupons/${id}?error=1`);
  await prisma.coupon.update({ where: { id }, data: couponData(parsed.data) });
  refresh();
  redirect(`/${locale}/admin/coupons?saved=1`);
}

export async function setCouponActive(locale: string, id: string, active: boolean) {
  await requirePerm(locale, "coupons.write");
  await prisma.coupon.update({ where: { id }, data: { active } });
  refresh();
  redirect(`/${locale}/admin/coupons?saved=1`);
}

export async function deleteCoupon(locale: string, id: string) {
  await requirePerm(locale, "coupons.write");
  await prisma.coupon.delete({ where: { id } });
  refresh();
  redirect(`/${locale}/admin/coupons?deleted=1`);
}

// ── Order fulfilment (status + tracking) ──────────────────────

/** Legal transitions only — an order can't skip payment or resurrect. */
const STATUS_FLOW: Record<string, string[]> = {
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
};

export async function updateOrderFulfilment(locale: string, id: string, formData: FormData) {
  await requirePerm(locale, "orders.write");
  const nextStatus = String(formData.get("status") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;

  const order = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
  if (!order) redirect(`/${locale}/admin/orders`);

  const allowed = STATUS_FLOW[order.status] ?? [];
  const statusChanging = nextStatus && nextStatus !== order.status;
  if (statusChanging && !allowed.includes(nextStatus)) {
    redirect(`/${locale}/admin/orders?error=bad_transition`);
  }

  await prisma.order.update({
    where: { id },
    data: {
      trackingNumber,
      ...(statusChanging
        ? {
            status: nextStatus,
            ...(nextStatus === "shipped" ? { shippedAt: new Date() } : {}),
            ...(nextStatus === "delivered" ? { deliveredAt: new Date() } : {}),
          }
        : {}),
    },
  });

  // Notify the customer on shipped/delivered — fire-and-forget.
  if (statusChanging && (nextStatus === "shipped" || nextStatus === "delivered")) {
    const { orderShippedEmail, orderDeliveredEmail, orderShippedSms, sendEmail, sendSms } =
      await import("@/lib/notify");
    const info = {
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      totalBaisa: order.totalBaisa,
      locale: order.locale,
      trackingNumber,
    };
    const mail = nextStatus === "shipped" ? orderShippedEmail(info) : orderDeliveredEmail(info);
    if (order.customer.email) void sendEmail(order.customer.email, mail.subject, mail.html);
    if (nextStatus === "shipped") void sendSms(order.customer.phone, orderShippedSms(info));
  }

  refresh();
  redirect(`/${locale}/admin/orders?saved=1`);
}

// ── Reviews moderation ────────────────────────────────────────

export async function setReviewApproved(locale: string, id: string, approved: boolean) {
  await requirePerm(locale, "reviews.write");
  await prisma.review.update({ where: { id }, data: { approved } });
  refresh();
  redirect(`/${locale}/admin/reviews?saved=1`);
}

export async function deleteReview(locale: string, id: string) {
  await requirePerm(locale, "reviews.write");
  await prisma.review.delete({ where: { id } });
  refresh();
  redirect(`/${locale}/admin/reviews?deleted=1`);
}

// ── Two-factor authentication (per staff account, self-service) ──

/** Step 1: mint a fresh secret for the signed-in staff member. Stored only
 * after a correct code confirms the authenticator actually has it. */
export async function beginTotpEnrollment(locale: string): Promise<never> {
  const { getCurrentAdmin } = await import("@/lib/admin-auth");
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  const { generateTotpSecret } = await import("@/lib/totp");
  const secret = generateTotpSecret();
  redirect(`/${locale}/admin/security?secret=${secret}`);
}

/** Step 2: verify the first code and persist the secret. */
export async function confirmTotpEnrollment(locale: string, formData: FormData) {
  const { getCurrentAdmin } = await import("@/lib/admin-auth");
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  const secret = String(formData.get("secret") ?? "");
  const code = String(formData.get("code") ?? "");
  const { verifyTotp } = await import("@/lib/totp");
  if (!secret || !verifyTotp(secret, code)) {
    redirect(`/${locale}/admin/security?secret=${secret}&error=1`);
  }
  await prisma.adminUser.update({ where: { id: admin!.id }, data: { totpSecret: secret } });
  refresh();
  redirect(`/${locale}/admin/security?enabled=1`);
}

export async function disableTotp(locale: string) {
  const { getCurrentAdmin } = await import("@/lib/admin-auth");
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  await prisma.adminUser.update({ where: { id: admin!.id }, data: { totpSecret: null } });
  refresh();
  redirect(`/${locale}/admin/security?disabled=1`);
}
