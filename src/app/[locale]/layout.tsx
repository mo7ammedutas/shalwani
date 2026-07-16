import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { VisitBeacon } from "@/components/layout/VisitBeacon";
import { CartDrawer } from "@/components/shop/CartDrawer";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: dict.meta.title,
      template: locale === "ar" ? "%s | شالواني" : "%s | Shalwani",
    },
    description: dict.meta.description,
    alternates: {
      languages: { ar: "/ar", en: "/en" },
    },
    openGraph: {
      type: "website",
      siteName: locale === "ar" ? "شالواني" : "Shalwani",
      locale: locale === "ar" ? "ar_OM" : "en_US",
      title: dict.meta.title,
      description: dict.meta.description,
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export const viewport: Viewport = {
  // --color-bg
  themeColor: "#12182a",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);
  const settings = await getSettings();

  const headerLabels = {
    brandName: dict.brand.name,
    brandLatin: dict.brand.nameLatin,
    announcement: dict.header.announcement,
    logoUrl: settings.logoUrl,
    nav: [
      { href: `/${locale}`, label: dict.nav.home },
      { href: `/${locale}/shop`, label: dict.nav.shop },
      { href: `/${locale}/story`, label: dict.nav.story },
      { href: `/${locale}/bespoke`, label: dict.nav.bespoke },
      { href: `/${locale}/contact`, label: dict.nav.contact },
    ],
    cart: dict.header.cart,
    account: dict.header.account,
    switchLocale: dict.header.switchLocale,
    switchLocaleLabel: dict.header.switchLocaleLabel,
    openMenu: dict.header.openMenu,
    closeMenu: dict.header.closeMenu,
    mainNav: dict.a11y.mainNav,
  };

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:bg-accent focus:text-text-on-accent focus:px-4 focus:py-2 focus:rounded-[var(--radius-soft)]"
      >
        {dict.a11y.skipToContent}
      </a>
      <CartProvider>
        <VisitBeacon />
        <Header locale={locale} labels={headerLabels} />
        <main id="content">{children}</main>
        <Footer locale={locale} dict={dict} whatsappUrl={settings.whatsappUrl} />
        <CartDrawer locale={locale} labels={dict.cart} />
        <WhatsAppFloat label={dict.whatsappFloat} href={settings.whatsappUrl} />
      </CartProvider>
    </>
  );
}
