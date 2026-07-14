import { Suspense } from "react";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { fill, getDictionary } from "@/lib/i18n";
import {
  getFacets,
  getProducts,
  PRICE_BUCKETS,
  type PriceBucket,
  type ShopQuery,
  type SortKey,
} from "@/lib/products";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ProductCard } from "@/components/shop/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : "ar");
  return { title: dict.shop.title, description: dict.shop.intro };
}

const SORT_KEYS: SortKey[] = ["newest", "price-asc", "price-desc"];

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale: raw }, sp] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);

  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const query: ShopQuery = {
    color: one(sp.color) || undefined,
    embroidery: one(sp.embroidery) || undefined,
    price: (Object.keys(PRICE_BUCKETS) as PriceBucket[]).includes(one(sp.price) as PriceBucket)
      ? (one(sp.price) as PriceBucket)
      : undefined,
    sort: SORT_KEYS.includes(one(sp.sort) as SortKey) ? (one(sp.sort) as SortKey) : undefined,
  };

  const [products, facets] = await Promise.all([getProducts(query), getFacets()]);

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-32 pb-24 flex flex-col gap-12">
      <header className="flex flex-col gap-5 max-w-2xl">
        <SectionHeading as="h1" eyebrow={dict.brand.tagline} title={dict.shop.title} />
        <p className="text-text-dim leading-loose">{dict.shop.intro}</p>
      </header>

      <div className="flex flex-col gap-6 hairline-t hairline-b py-6">
        <Suspense>
          <ShopFilters
            labels={dict.shop.filters}
            colorOptions={facets.colors.map((c) => ({ value: c, label: dict.colors[c] ?? c }))}
            embroideryOptions={facets.embroideries.map((e) => ({
              value: e,
              label: dict.embroidery[e] ?? e,
            }))}
          />
        </Suspense>
        <p className="text-sm text-text-dim" data-testid="result-count">
          {fill(dict.shop.resultCount, { count: products.length })}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-text-dim">{dict.shop.empty}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <li key={p.slug}>
              <ProductCard product={p} locale={locale} dict={dict} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
