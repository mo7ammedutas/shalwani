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

  const [related, images, customer] = await Promise.all([
    getRelated(product),
    productImages(product),
    getCurrentCustomer(),
  ]);
  const isWishlisted = customer
    ? Boolean(
        await prisma.wishlistItem.findUnique({
          where: { customerId_productId: { customerId: customer.id, productId: product.id } },
        }),
      )
    : false;
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
