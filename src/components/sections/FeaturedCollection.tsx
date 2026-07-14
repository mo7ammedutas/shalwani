import type { Product } from "@prisma/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/shop/ProductCard";
import { ButtonLink } from "@/components/ui/Button";

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
  const [lead, ...rest] = products;

  return (
    <section className="hairline-t bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-24 md:py-32 flex flex-col gap-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow={dict.featured.eyebrow} title={dict.featured.title} />
          <ButtonLink href={`/${locale}/shop`} variant="quiet">
            {dict.featured.viewAll}
          </ButtonLink>
        </div>

        {/* Uneven gallery: one commanding piece, four supporting */}
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <ProductCard product={lead} locale={locale} dict={dict} large />
          </div>
          <div className="md:col-span-5 grid grid-cols-2 gap-6 content-start">
            {rest.slice(0, 4).map((p) => (
              <ProductCard key={p.slug} product={p} locale={locale} dict={dict} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
