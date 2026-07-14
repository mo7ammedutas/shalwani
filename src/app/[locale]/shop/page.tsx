import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
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
    <div className="flex flex-col">
      {/* Collection image hero — reference-theme banner with dark wash */}
      <section className="relative flex min-h-64 items-center justify-center overflow-hidden md:min-h-80">
        <Image
          src="/shop-banner.svg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-accent-dark)_30%,transparent)]"
        />
        <div className="relative flex flex-col items-center gap-3 px-5 text-center">
          <h1 className="font-heading text-4xl font-light uppercase tracking-[0.1em] text-text-on-accent">
            {dict.shop.title}
          </h1>
          <p className="max-w-xl text-base text-text-on-accent/90">{dict.shop.intro}</p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 md:px-8 pb-20 flex flex-col gap-10">
        <div className="flex flex-col gap-4 hairline-b py-6">
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
          <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {products.map((p, i) => (
              <li key={p.slug}>
                <ProductCard product={p} locale={locale} dict={dict} priority={i < 4} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
