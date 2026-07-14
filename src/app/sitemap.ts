import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { locales } from "@/lib/i18n/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const products = await prisma.product.findMany({ select: { slug: true, createdAt: true } });

  const staticPaths = ["", "/shop", "/story", "/bespoke", "/contact"];

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
        },
      });
    }
    for (const product of products) {
      entries.push({
        url: `${siteUrl}/${locale}/shop/${product.slug}`,
        lastModified: product.createdAt,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${siteUrl}/${l}/shop/${product.slug}`]),
          ),
        },
      });
    }
  }
  return entries;
}
