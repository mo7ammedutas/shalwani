import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { SOCIAL } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/ui/icons";

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="relative min-h-svh flex items-end overflow-hidden">
      <Image
        src="/hero.svg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Legibility scrim, bottom-weighted */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/20"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 md:px-8 pb-20 pt-40 md:pb-28">
        <div className="max-w-2xl flex flex-col gap-7">
          <p
            className="rise-in text-sm tracking-[0.24em] uppercase text-accent-light"
            style={{ animationDelay: "80ms" }}
          >
            {dict.hero.eyebrow}
          </p>
          <h1
            className="rise-in font-display text-4xl md:text-5xl leading-[1.15] text-text"
            style={{ animationDelay: "180ms" }}
          >
            {dict.hero.title}
          </h1>
          <p
            className="rise-in max-w-xl text-lg text-text-dim leading-relaxed"
            style={{ animationDelay: "300ms" }}
          >
            {dict.hero.subtitle}
          </p>
          <div
            className="rise-in mt-2 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "420ms" }}
          >
            <ButtonLink href={`/${locale}/shop`} variant="primary" data-testid="hero-shop-cta">
              {dict.hero.ctaShop}
            </ButtonLink>
            <ButtonLink href={SOCIAL.whatsapp} variant="quiet">
              <IconWhatsApp className="size-4.5" />
              {dict.hero.ctaWhatsApp}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
