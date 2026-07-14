import type { Product } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { ProductCard } from "@/components/shop/ProductCard";
import { ButtonLink } from "@/components/ui/Button";

/** Reference-theme featured grid: centred section title, four-up squares. */
export function FeaturedCollection({
  products,
  locale,
  dict,
}: {
  products: Product[];
  locale: Locale;
  dict: Dictionary;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 md:px-8 py-16 md:py-20 flex flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="type-label text-accent-light">{dict.featured.eyebrow}</p>
        <h2 className="font-heading text-3xl font-light text-text">{dict.featured.title}</h2>
      </div>

      <ul className="grid w-full grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {products.slice(0, 4).map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} locale={locale} dict={dict} />
          </li>
        ))}
      </ul>

      <ButtonLink href={`/${locale}/shop`} variant="quiet">
        {dict.featured.viewAll}
      </ButtonLink>
    </section>
  );
}
