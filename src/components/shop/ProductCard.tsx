import Link from "next/link";
import Image from "next/image";
import type { Product } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { productImagesClient } from "@/lib/product-images";
import { Price } from "@/components/ui/Price";

/** Reference-theme card: square image, corner badge, centred details,
 * uppercase title, quiet meta price. */
export function ProductCard({
  product,
  locale,
  dict,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
}) {
  const name = locale === "ar" ? product.nameAr : product.nameEn;
  const image = productImagesClient(product.images)[0];
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/${locale}/shop/${product.slug}`}
      data-testid="product-card"
      className="group relative flex flex-col gap-3"
    >
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Image
          src={image}
          alt={name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-opacity duration-[var(--duration-stately)] ease-[var(--ease-luxe)] group-hover:opacity-80"
        />
        {soldOut ? (
          <span className="absolute top-3 end-3 bg-bg px-2.5 py-1 text-xs tracking-[0.08em] uppercase text-surface-cream">
            {dict.product.outOfStock}
          </span>
        ) : product.stock <= 3 ? (
          <span className="absolute top-3 end-3 bg-bg px-2.5 py-1 text-xs tracking-[0.08em] uppercase text-accent-light">
            {dict.product.lowStock}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-base uppercase tracking-[0.06em] text-text group-hover:text-accent-light transition-colors duration-[var(--duration-calm)]">
          {name}
        </h3>
        <p className="text-sm text-text-dim">
          {dict.colors[product.color]} · {dict.embroidery[product.embroidery]}
        </p>
        <Price baisa={product.priceBaisa} locale={locale} className="text-sm text-surface-cream" />
      </div>
    </Link>
  );
}
