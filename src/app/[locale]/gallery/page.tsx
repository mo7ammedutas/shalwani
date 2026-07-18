import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { isLocale, SOCIAL, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { productImagesClient } from "@/lib/product-images";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : "ar");
  return { title: dict.gallery.title, description: dict.gallery.intro };
}

/**
 * Lookbook — every image comes straight from the live catalogue, so the
 * moment real photography is uploaded to a product it appears here too.
 */
export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const t = dict.gallery;

  const products = await prisma.product.findMany({
    where: { archived: false },
    orderBy: [{ featured: "desc" }, { priceBaisa: "desc" }],
  });

  const items = products.flatMap((p) =>
    productImagesClient(p.images).map((src, i) => ({
      src,
      slug: p.slug,
      name: locale === "ar" ? p.nameAr : p.nameEn,
      key: `${p.slug}-${i}`,
    })),
  );

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20 flex flex-col gap-16">
      <header className="max-w-2xl flex flex-col gap-6">
        <SectionHeading as="h1" eyebrow={dict.nav.bespoke} title={t.title} />
        <p className="text-text-dim leading-loose">{t.intro}</p>
      </header>

      {items.length === 0 ? (
        <p className="py-14 text-center text-text-dim">{t.empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" data-testid="gallery-grid">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={`/${locale}/shop/${item.slug}`}
                className="group relative block aspect-square overflow-hidden bg-surface"
              >
                <Image
                  src={item.src}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-[var(--duration-stately)] ease-[var(--ease-luxe)] group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-bg/80 px-3 py-2 text-xs text-text opacity-0 transition-opacity duration-[var(--duration-calm)] group-hover:opacity-100">
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-5 hairline-t pt-14 text-center">
        <p className="max-w-2xl text-text-dim leading-loose">{t.ctaNote}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <ButtonLink href={SOCIAL.instagram} variant="quiet">
            {t.instagramCta}
          </ButtonLink>
          <ButtonLink href={SOCIAL.whatsapp} variant="primary">
            {t.whatsappCta}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
