import Link from "next/link";
import { SOCIAL, type Locale } from "@/lib/i18n/config";
import { fill, type Dictionary } from "@/lib/i18n";
import { IconInstagram, IconWhatsApp, BrandSeal } from "@/components/ui/icons";

export function Footer({
  locale,
  dict,
  whatsappUrl = SOCIAL.whatsapp,
}: {
  locale: Locale;
  dict: Dictionary;
  whatsappUrl?: string;
}) {
  const year = new Date().getFullYear();
  const nav = [
    { href: `/${locale}/shop`, label: dict.nav.shop },
    { href: `/${locale}/story`, label: dict.nav.story },
    { href: `/${locale}/gallery`, label: dict.nav.bespoke },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <footer className="print:hidden hairline-t bg-surface/60">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-14 grid gap-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="flex flex-col gap-5 max-w-sm">
          <div className="flex items-center gap-3">
            <BrandSeal className="size-6 text-accent" />
            <span lang="ar" className="font-display text-2xl text-text">
              شالواني
            </span>
            <span
              lang="en"
              className="font-display text-xs tracking-[0.35em] uppercase text-text-dim mt-1"
            >
              Shalwani
            </span>
          </div>
          <p className="text-text-dim leading-relaxed">{dict.footer.blurb}</p>
          <p className="text-sm text-text-dim">{dict.footer.madeIn}</p>
        </div>

        <nav aria-label={dict.a11y.footerNav}>
          <h2 className="mb-5 text-sm tracking-[0.22em] uppercase text-accent-light">
            {dict.footer.navTitle}
          </h2>
          <ul className="flex flex-col gap-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-text hover:text-accent-light">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-5 text-sm tracking-[0.22em] uppercase text-accent-light">
            {dict.footer.followTitle}
          </h2>
          <ul className="flex flex-col gap-3">
            <li>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-text hover:text-accent-light"
              >
                <IconInstagram className="size-4.5" />
                {dict.footer.instagram}
              </a>
            </li>
            <li>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-text hover:text-accent-light"
              >
                <IconWhatsApp className="size-4.5" />
                {dict.footer.whatsapp}
              </a>
            </li>
          </ul>
          <p className="mt-4 text-sm text-text-dim leading-relaxed">{dict.footer.whatsappNote}</p>
        </div>
      </div>

      <div className="hairline-t">
        <p className="mx-auto max-w-6xl px-5 md:px-8 py-6 text-sm text-text-dim">
          {fill(dict.footer.rights, { year })}
        </p>
      </div>
    </footer>
  );
}
