import "server-only";
import { prisma } from "@/lib/db";
import { getCustomersWithStats, type CustomerStats } from "@/lib/crm";

const DAY_MS = 24 * 3600_000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface RevenuePoint {
  day: string; // "YYYY-MM-DD"
  revenueBaisa: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  quantitySold: number;
  revenueBaisa: number;
}

export interface AnalyticsSummary {
  rangeDays: number;
  revenueSeries: RevenuePoint[];
  totalRevenueBaisa: number;
  totalOrders: number;
  avgOrderValueBaisa: number;
  topProducts: TopProduct[];
  topCustomers: CustomerStats[];
  lowStockProducts: { id: string; slug: string; nameAr: string; nameEn: string; stock: number }[];
  pageViews: number;
  conversionRatePercent: number | null; // null when there's no traffic data yet
}

export async function getAnalyticsSummary(rangeDays = 30): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - rangeDays * DAY_MS);

  const paidOrders = await prisma.order.findMany({
    where: { status: "paid", createdAt: { gte: since } },
    select: { totalBaisa: true, createdAt: true },
  });

  // Build a zero-filled daily series so the chart doesn't skip quiet days.
  const byDay = new Map<string, { revenueBaisa: number; orderCount: number }>();
  for (let i = 0; i < rangeDays; i++) {
    const d = dayKey(new Date(Date.now() - i * DAY_MS));
    byDay.set(d, { revenueBaisa: 0, orderCount: 0 });
  }
  for (const o of paidOrders) {
    const key = dayKey(o.createdAt);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.revenueBaisa += o.totalBaisa;
      bucket.orderCount += 1;
    }
  }
  const revenueSeries = [...byDay.entries()]
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const totalRevenueBaisa = paidOrders.reduce((s, o) => s + o.totalBaisa, 0);
  const totalOrders = paidOrders.length;
  const avgOrderValueBaisa = totalOrders > 0 ? Math.round(totalRevenueBaisa / totalOrders) : 0;

  const items = await prisma.orderItem.findMany({
    where: { order: { status: "paid", createdAt: { gte: since } } },
    include: { product: { select: { id: true, slug: true, nameAr: true, nameEn: true } } },
  });
  const byProduct = new Map<string, TopProduct>();
  for (const i of items) {
    const existing = byProduct.get(i.productId);
    const revenue = i.unitPriceBaisa * i.quantity;
    if (existing) {
      existing.quantitySold += i.quantity;
      existing.revenueBaisa += revenue;
    } else {
      byProduct.set(i.productId, {
        productId: i.productId,
        slug: i.product.slug,
        nameAr: i.product.nameAr,
        nameEn: i.product.nameEn,
        quantitySold: i.quantity,
        revenueBaisa: revenue,
      });
    }
  }
  const topProducts = [...byProduct.values()]
    .sort((a, b) => b.revenueBaisa - a.revenueBaisa)
    .slice(0, 5);

  const [allCustomers, lowStock, pageViewRows] = await Promise.all([
    getCustomersWithStats(),
    prisma.product.findMany({
      where: { archived: false, stock: { lte: 5 } },
      select: { id: true, slug: true, nameAr: true, nameEn: true, stock: true },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    prisma.pageView.findMany({
      where: { day: { gte: dayKey(since) } },
      select: { count: true },
    }),
  ]);
  const topCustomers = allCustomers.slice(0, 5);
  const pageViews = pageViewRows.reduce((s, r) => s + r.count, 0);
  const conversionRatePercent = pageViews > 0 ? (totalOrders / pageViews) * 100 : null;

  return {
    rangeDays,
    revenueSeries,
    totalRevenueBaisa,
    totalOrders,
    avgOrderValueBaisa,
    topProducts,
    topCustomers,
    lowStockProducts: lowStock,
    pageViews,
    conversionRatePercent,
  };
}
