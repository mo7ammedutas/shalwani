"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { otherLocale, type Locale } from "@/lib/i18n/config";
import { IconBag, IconClose, IconMenu, IconUser } from "@/components/ui/icons";

export interface HeaderLabels {
  brandName: string;
  brandLatin: string;
  announcement: string;
  logoUrl?: string;
  nav: { href: string; label: string }[];
  cart: string;
  account: string;
  switchLocale: string;
  switchLocaleLabel: string;
  openMenu: string;
  closeMenu: string;
  mainNav: string;
}

/** Reference-theme header: announcement bar on navy, centred stacked
 * wordmark, uppercase nav row below, utility icons at the edges. */
export function Header({ locale, labels }: { locale: Locale; labels: HeaderLabels }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart, hydrated } = useCart();

  // Close the mobile menu on navigation — state adjustment during render,
  // per the React "you might not need an effect" pattern.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const target = otherLocale(locale);
  const switchedPath =
    pathname.replace(new RegExp(`^/${locale}(?=/|$)`), `/${target}`) || `/${target}`;

  const rememberLocale = () => {
    document.cookie = `NEXT_LOCALE=${target};path=/;max-age=31536000;samesite=lax`;
  };

  const isActive = (href: string) =>
    href === `/${locale}` ? pathname === href : pathname.startsWith(href);

  return (
    <header className="print:hidden sticky top-0 z-40 bg-bg">
      {/* Announcement / utility bar */}
      <div className="bg-accent text-text-on-accent">
        <p className="mx-auto max-w-6xl px-5 py-2 text-center text-sm tracking-wide">
          {labels.announcement}
        </p>
      </div>

      {/* Main row: utilities — centred logo — cart */}
      <div className="hairline-b">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5 py-4 md:px-8 md:py-5">
          <div className="flex items-center gap-1 justify-self-start">
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="p-2 text-text hover:text-accent-light md:hidden cursor-pointer"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? labels.closeMenu : labels.openMenu}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <IconClose className="size-5" /> : <IconMenu className="size-5" />}
            </button>
            {/* Language switcher — a plain anchor on purpose: flipping lang/dir
                on <html> requires a full document load, not a soft navigation. */}
            <a
              href={switchedPath}
              onClick={rememberLocale}
              aria-label={labels.switchLocaleLabel}
              lang={target}
              className="hidden md:inline-block px-2 py-1.5 type-label text-text-dim hover:text-accent-light"
            >
              {labels.switchLocale}
            </a>
          </div>

          {/* Centred logo — merchant-uploaded image if set, else the
              stacked text wordmark. */}
          <Link
            href={`/${locale}`}
            className="justify-self-center flex flex-col items-center gap-0.5 text-text hover:text-accent-light"
          >
            {labels.logoUrl ? (
              <Image
                src={labels.logoUrl}
                alt={labels.brandName}
                width={112}
                height={112}
                className="h-28 w-auto object-contain"
                priority
              />
            ) : (
              <>
                <span lang="ar" className="font-display text-[3.5rem] font-bold leading-none">
                  شالواني
                </span>
                <span
                  lang="en"
                  className="font-display text-[1.4rem] font-light tracking-[0.5em] uppercase text-text-dim ps-[0.5em]"
                >
                  Shalwani
                </span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-1 justify-self-end">
            <a
              href={switchedPath}
              onClick={rememberLocale}
              aria-label={labels.switchLocaleLabel}
              lang={target}
              className="md:hidden px-2 py-1.5 type-label text-text-dim hover:text-accent-light"
            >
              {labels.switchLocale}
            </a>
            <Link
              href={`/${locale}/account`}
              aria-label={labels.account}
              data-testid="account-link"
              className="p-2 text-text hover:text-accent-light"
            >
              <IconUser className="size-5" />
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label={labels.cart}
              data-testid="cart-button"
              className="relative p-2 text-text hover:text-accent-light cursor-pointer"
            >
              <IconBag className="size-5" />
              {hydrated && count > 0 ? (
                <span
                  data-testid="cart-count"
                  className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-accent-light text-text-on-accent text-[0.6rem] tabular"
                >
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Desktop nav row — centred, uppercase, below the logo */}
        <nav aria-label={labels.mainNav} className="hidden md:block">
          <ul className="mx-auto flex max-w-6xl items-center justify-center gap-10 px-8 pb-4">
            {labels.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`type-label pb-1 border-b ${
                    isActive(item.href)
                      ? "text-accent-light border-accent-light"
                      : "text-text border-transparent hover:text-accent-light"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile nav panel */}
      <nav
        id="mobile-nav"
        aria-label={labels.mainNav}
        className={`md:hidden overflow-hidden bg-bg transition-[max-height] duration-[var(--duration-stately)] ease-[var(--ease-luxe)] ${
          menuOpen ? "max-h-96 hairline-b" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col px-5 py-3">
          {labels.nav.map((item) => (
            <li key={item.href} className="hairline-b last:border-b-0">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`block py-3 type-label ${
                  isActive(item.href) ? "text-accent-light" : "text-text"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
