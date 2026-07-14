import Link from "next/link";
import Image from "next/image";
import type { Product } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { productImagesClient } from "@/lib/product-images";
import { Price } from "@/components/ui/Price";

export function ProductCard({
  product,
  locale,
  dict,
  large = false,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
  large?: boolean;
  priority?: boolean;
}) {
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const image = productImagesClient(product.images)[0];
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/${locale}/shop/${product.slug}`}
      data-testid="product-card"
      className="group flex flex-col gap-4"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-soft)] border border-surface-muted bg-surface">
        <Image
          src={image}
          alt={name}
          fill
          priority={priority}
          sizes={large ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
          className="object-cover transition-transform duration-[var(--duration-stately)] ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
        />
        {soldOut ? (
          <span className="absolute top-3 start-3 bg-surface/90 border border-surface-muted px-3 py-1 text-xs tracking-wide text-surface-cream rounded-[var(--radius-soft)]">
            {dict.product.outOfStock}
          </span>
        ) : product.stock <= 3 ? (
          <span className="absolute top-3 start-3 bg-surface/90 border border-surface-muted px-3 py-1 text-xs tracking-wide text-accent-light rounded-[var(--radius-soft)]">
            {dict.product.lowStock}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3
            className={`font-heading text-text group-hover:text-accent-light transition-colors duration-[var(--duration-calm)] ${
              large ? "text-2xl" : "text-lg"
            }`}
          >
            {name}
          </h3>
          <p className="text-sm text-text-dim">
            {dict.colors[product.color]} · {dict.embroidery[product.embroidery]}
          </p>
        </div>
        <Price baisa={product.priceBaisa} locale={locale} className="text-base text-surface-cream shrink-0" />
      </div>
    </Link>
  );
}
