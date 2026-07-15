import "server-only";
import { prisma } from "@/lib/db";
import type { Product } from "@prisma/client";

export const PRICE_BUCKETS = {
  under25: { lt: 25000 },
  "25to40": { gte: 25000, lte: 40000 },
  over40: { gt: 40000 },
} as const;

export type PriceBucket = keyof typeof PRICE_BUCKETS;
export type SortKey = "newest" | "price-asc" | "price-desc";

export interface ShopQuery {
  color?: string;
  embroidery?: string;
  price?: PriceBucket;
  sort?: SortKey;
}

export async function getProducts(query: ShopQuery = {}): Promise<Product[]> {
  return prisma.product.findMany({
    where: {
      archived: false,
      ...(query.color ? { color: query.color } : {}),
      ...(query.embroidery ? { embroidery: query.embroidery } : {}),
      ...(query.price ? { priceBaisa: PRICE_BUCKETS[query.price] } : {}),
    },
    orderBy:
      query.sort === "price-asc"
        ? { priceBaisa: "asc" }
        : query.sort === "price-desc"
          ? { priceBaisa: "desc" }
          : { createdAt: "desc" },
  });
}

export async function getProduct(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({ where: { slug } });
  return product && !product.archived ? product : null;
}

export async function getFeatured(): Promise<Product[]> {
  return prisma.product.findMany({
    where: { featured: true, archived: false },
    orderBy: { priceBaisa: "desc" },
    take: 5,
  });
}

export async function getRelated(product: Product, take = 3): Promise<Product[]> {
  return prisma.product.findMany({
    where: {
      archived: false,
      slug: { not: product.slug },
      OR: [{ color: product.color }, { embroidery: product.embroidery }],
    },
    take,
  });
}

/** Distinct facet values actually present in the catalogue. */
export async function getFacets(): Promise<{ colors: string[]; embroideries: string[] }> {
  const rows = await prisma.product.findMany({
    where: { archived: false },
    select: { color: true, embroidery: true },
  });
  return {
    colors: [...new Set(rows.map((r) => r.color))],
    embroideries: [...new Set(rows.map((r) => r.embroidery))],
  };
}

export function productImages(product: Product): string[] {
  try {
    const parsed = JSON.parse(product.images) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["/products/missing.svg"];
  } catch {
    return ["/products/missing.svg"];
  }
}
