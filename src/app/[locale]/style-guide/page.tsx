import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getFeatured } from "@/lib/products";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label, Select, TextArea, TextInput } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/shop/ProductCard";

export const metadata: Metadata = {
  title: "Style Guide",
  robots: { index: false },
};

/** Internal design-system preview: tokens, type, controls, shop components. */
const SWATCHES = [
  ["--color-bg", "bg"],
  ["--color-surface", "surface"],
  ["--color-surface-muted", "surface-muted"],
  ["--color-accent", "accent"],
  ["--color-accent-light", "accent-light"],
  ["--color-accent-dark", "accent-dark"],
  ["--color-accent-secondary", "accent-secondary"],
  ["--color-text", "text"],
  ["--color-surface-cream", "surface-cream"],
  ["--color-text-on-accent", "text-on-accent"],
] as const;

export default async function StyleGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const [sample] = await getFeatured();

  const block = "flex flex-col gap-8 py-14 hairline-t";

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20 flex flex-col">
      <header className="pb-10">
        <SectionHeading
          as="h1"
          eyebrow="Internal"
          title={locale === "ar" ? "دليل التصميم" : "Style Guide"}
        />
      </header>

      <section className={block}>
        <h2 className="font-heading text-2xl text-text">Palette</h2>
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {SWATCHES.map(([variable, name]) => (
            <li key={variable} className="flex flex-col gap-2.5">
              <span
                className="block h-20 rounded-[var(--radius-soft)] border border-surface-muted"
                style={{ backgroundColor: `var(${variable})` }}
              />
              <span lang="en" dir="ltr" className="text-xs text-text-dim tracking-wide">
                {name}
                <br />
                <code className="text-accent-light">{variable}</code>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={block}>
        <h2 className="font-heading text-2xl text-text">Typography</h2>
        <div className="flex flex-col gap-6">
          <p className="font-display text-5xl text-text">{dict.brand.name}</p>
          <p className="font-heading text-3xl text-text">{dict.hero.title}</p>
          <p className="font-body text-base text-text-dim max-w-prose">{dict.hero.subtitle}</p>
          <p className="text-sm tracking-[0.22em] uppercase text-accent-light">
            {dict.hero.eyebrow}
          </p>
        </div>
      </section>

      <section className={block}>
        <h2 className="font-heading text-2xl text-text">Buttons</h2>
        <div className="flex flex-wrap items-center gap-5">
          <Button variant="primary">{dict.hero.ctaShop}</Button>
          <Button variant="quiet">{dict.hero.ctaWhatsApp}</Button>
          <Button variant="danger-quiet">{dict.cart.remove}</Button>
          <Button variant="primary" disabled>
            {dict.checkout.processing}
          </Button>
          <ButtonLink href={`/${locale}`} variant="quiet">
            {dict.success.backHome}
          </ButtonLink>
        </div>
      </section>

      <section className={block}>
        <h2 className="font-heading text-2xl text-text">Form controls</h2>
        <div className="grid gap-6 max-w-xl">
          <div>
            <Label htmlFor="sg-input">{dict.checkout.name}</Label>
            <TextInput id="sg-input" placeholder={dict.checkout.namePlaceholder} />
          </div>
          <div>
            <Label htmlFor="sg-select">{dict.shop.filters.color}</Label>
            <Select id="sg-select">
              <option>{dict.shop.filters.all}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="sg-area">{dict.checkout.notes}</Label>
            <TextArea id="sg-area" placeholder={dict.checkout.notesPlaceholder} />
          </div>
        </div>
      </section>

      <section className={block}>
        <h2 className="font-heading text-2xl text-text">Commerce</h2>
        <div className="flex flex-wrap items-start gap-12">
          <div className="flex flex-col gap-3">
            <Price baisa={45000} locale={locale} className="font-display text-2xl text-surface-cream" />
            <Price baisa={19500} locale={locale} className="text-base text-text-dim" />
          </div>
          {sample ? (
            <div className="w-72">
              <ProductCard product={sample} locale={locale} dict={dict} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
