import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { SOCIAL } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/ui/icons";

/** Reference-theme image hero: full-bleed photo, dark wash, centred copy.
 * The backdrop is merchant-managed (Settings → Branding); falls back to
 * the bundled placeholder art until a real photo is uploaded. */
export function Hero({
  locale,
  dict,
  imageUrl,
}: {
  locale: Locale;
  dict: Dictionary;
  imageUrl?: string;
}) {
  return (
    <section className="relative flex min-h-[70svh] items-center justify-center overflow-hidden">
      <Image
        src={imageUrl || "/hero.svg"}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-accent-dark)_38%,transparent)]"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 py-24 text-center">
        <p
          className="rise-in type-label text-text-on-accent/85"
          style={{ animationDelay: "80ms" }}
        >
          {dict.hero.eyebrow}
        </p>
        <h1
          className="rise-in font-heading text-4xl md:text-5xl font-light leading-snug text-text-on-accent"
          style={{ animationDelay: "180ms" }}
        >
          {dict.hero.title}
        </h1>
        <p
          className="rise-in max-w-xl text-lg text-text-on-accent/90"
          style={{ animationDelay: "300ms" }}
        >
          {dict.hero.subtitle}
        </p>
        <div
          className="rise-in mt-2 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "420ms" }}
        >
          <ButtonLink
            href={`/${locale}/shop`}
            variant="primary"
            className="!bg-text-on-accent !text-accent hover:!bg-bg"
            data-testid="hero-shop-cta"
          >
            {dict.hero.ctaShop}
          </ButtonLink>
          <ButtonLink
            href={SOCIAL.whatsapp}
            variant="quiet"
            className="!border-text-on-accent/60 !text-text-on-accent hover:!border-text-on-accent"
          >
            <IconWhatsApp className="size-4" />
            {dict.hero.ctaWhatsApp}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
