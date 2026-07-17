import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getProduct, getRelated, productImages } from "@/lib/products";
import { baisaToOmr } from "@/lib/money";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { AddToCart } from "@/components/shop/AddToCart";
import { ProductCard } from "@/components/shop/ProductCard";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { ReviewForm } from "@/components/shop/ReviewForm";
import { Price } from "@/components/ui/Price";
import { IconArrow } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const product = await getProduct(slug);
  if (!product) return {};
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const description = locale === "ar" ? product.descriptionAr : product.descriptionEn;
  return {
    title: name,
    description,
    openGraph: { title: name, description, images: productImages(product) },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);

  const product = await getProduct(slug);
  if (!product) notFound();

  const [related, images, customer, reviews] = await Promise.all([
    getRelated(product),
    productImages(product),
    getCurrentCustomer(),
    prisma.review.findMany({
      where: { productId: product.id, approved: true },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
  ]);
  const isWishlisted = customer
    ? Boolean(
        await prisma.wishlistItem.findUnique({
          where: { customerId_productId: { customerId: customer.id, productId: product.id } },
        }),
      )
    : false;

  // Review eligibility: signed in + verified purchase + not yet reviewed.
  let reviewState: "form" | "login" | "purchase" | "already" = "login";
  if (customer) {
    const [purchased, own] = await Promise.all([
      prisma.orderItem.findFirst({
        where: {
          productId: product.id,
          order: { customerId: customer.id, status: { in: ["paid", "shipped", "delivered"] } },
        },
        select: { id: true },
      }),
      prisma.review.findUnique({
        where: { productId_customerId: { productId: product.id, customerId: customer.id } },
        select: { id: true },
      }),
    ]);
    reviewState = own ? "already" : purchased ? "form" : "purchase";
  }
  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const description = locale === "ar" ? product.descriptionAr : product.descriptionEn;
  const inStock = product.stock > 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: images.map((i) => `${siteUrl}${i}`),
    url: `${siteUrl}/${locale}/shop/${product.slug}`,
    brand: { "@type": "Brand", name: "Shalwani | شالواني" },
    offers: {
      "@type": "Offer",
      priceCurrency: "OMR",
      price: baisaToOmr(product.priceBaisa).toFixed(3),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl}/${locale}/shop/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-8 pb-20 flex flex-col gap-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label={dict.a11y.breadcrumb} className="text-sm text-text-dim">
        <Link
          href={`/${locale}/shop`}
          className="inline-flex items-center gap-2 hover:text-accent-light"
        >
          <IconArrow className="size-4 rotate-180 rtl:-scale-x-100" />
          {dict.product.backToShop}
        </Link>
      </nav>

      <div className="grid gap-12 md:grid-cols-2 md:gap-16 -mt-12">
        <ProductGallery images={images} name={name} labels={dict.product} />

        <div className="flex flex-col gap-7 md:pt-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm tracking-[0.22em] uppercase text-accent-light">
              {dict.colors[product.color] ?? product.color} ·{" "}
              {dict.embroidery[product.embroidery] ?? product.embroidery}
            </p>
            <h1 className="font-heading text-3xl md:text-4xl text-text leading-tight">{name}</h1>
          </div>

          <Price
            baisa={product.priceBaisa}
            locale={locale}
            className="font-display text-2xl text-surface-cream"
          />

          <p className="text-text-dim leading-loose">{description}</p>

          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={`inline-block size-2 rounded-full ${
                inStock ? "bg-accent" : "bg-accent-secondary"
              }`}
            />
            <span className={inStock ? "text-accent-light" : "text-surface-cream"} data-testid="stock-status">
              {inStock
                ? product.stock <= 3
                  ? dict.product.lowStock
                  : dict.product.inStock
                : dict.product.outOfStock}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AddToCart
              product={{
                slug: product.slug,
                nameAr: product.nameAr,
                nameEn: product.nameEn,
                priceBaisa: product.priceBaisa,
                image: images[0],
                stock: product.stock,
              }}
              labels={dict.product}
            />
            <WishlistButton
              productId={product.id}
              initialWishlisted={isWishlisted}
              isLoggedIn={!!customer}
              locale={locale}
              addLabel={dict.account.wishlistAdd}
              removeLabel={dict.account.wishlistRemove}
            />
          </div>

          <dl className="hairline-t pt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-text-dim mb-1">{dict.product.material}</dt>
              <dd className="text-text">{dict.product.materialValue}</dd>
            </div>
            <div>
              <dt className="text-text-dim mb-1">{dict.product.craft}</dt>
              <dd className="text-text">{dict.product.craftValue}</dd>
            </div>
            <div>
              <dt className="text-text-dim mb-1">{dict.product.color}</dt>
              <dd className="text-text">{dict.colors[product.color] ?? product.color}</dd>
            </div>
            <div>
              <dt className="text-text-dim mb-1">{dict.product.embroidery}</dt>
              <dd className="text-text">
                {dict.embroidery[product.embroidery] ?? product.embroidery}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="hairline-t pt-16 flex flex-col gap-8" data-testid="reviews-section">
        <div className="flex flex-wrap items-baseline gap-4">
          <h2 className="font-heading text-2xl text-text">{dict.product.reviews.title}</h2>
          {avgRating != null ? (
            <span className="text-accent-light tabular" dir="ltr" data-testid="avg-rating">
              ★ {avgRating.toFixed(1)} · {reviews.length}
            </span>
          ) : null}
        </div>

        {reviews.length === 0 ? (
          <p className="text-text-dim">{dict.product.reviews.empty}</p>
        ) : (
          <ul className="flex flex-col gap-6">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 hairline-b pb-6" data-testid="review-item">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-text">{r.customer.name}</span>
                  <span className="type-label bg-surface-muted px-2 py-0.5 text-accent-light">
                    {dict.product.reviews.verifiedBadge}
                  </span>
                  <span className="text-accent-light tabular" dir="ltr" aria-label={`${r.rating}/5`}>
                    {"★".repeat(r.rating)}
                    <span className="text-surface-muted">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span className="text-xs text-text-dim tabular" dir="ltr">
                    {r.createdAt.toISOString().slice(0, 10)}
                  </span>
                </div>
                <p className="text-text-dim leading-loose">{r.text}</p>
              </li>
            ))}
          </ul>
        )}

        {reviewState === "form" ? (
          <ReviewForm productId={product.id} dict={dict} />
        ) : (
          <p className="text-sm text-text-dim" data-testid="review-gate">
            {reviewState === "login"
              ? dict.product.reviews.loginToReview
              : reviewState === "purchase"
                ? dict.product.reviews.purchaseToReview
                : dict.product.reviews.alreadyReviewed}
          </p>
        )}
      </section>

      {related.length > 0 ? (
        <section className="hairline-t pt-16 flex flex-col gap-10">
          <h2 className="font-heading text-2xl text-text">{dict.product.related}</h2>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} locale={locale} dict={dict} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
