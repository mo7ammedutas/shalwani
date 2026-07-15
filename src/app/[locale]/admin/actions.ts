"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { omrToBaisa } from "@/lib/money";
import { isLocale } from "@/lib/i18n/config";

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
  stock: z.coerce.number().int().min(0).max(9999),
  featured: z.boolean(),
  archived: z.boolean(),
  images: z.array(z.string().trim().min(1).max(500)).min(1).max(8),
});

async function guard(locale: string) {
  if (!(await isAdmin())) {
    redirect(`/${isLocale(locale) ? locale : "ar"}/admin/login`);
  }
}

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
  await guard(locale);
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
  await guard(locale);
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
  await guard(locale);
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
  await guard(locale);
  await prisma.product.update({ where: { id }, data: { archived } });
  refresh();
  redirect(`/${locale}/admin?saved=1`);
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
  await guard(locale);
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
  await guard(locale);
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
  await guard(locale);
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
  await guard(locale);
  await prisma.giftAddon.update({ where: { id }, data: { active } });
  refresh();
  redirect(`/${locale}/admin/gift-addons?saved=1`);
}
