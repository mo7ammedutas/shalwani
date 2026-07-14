"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { otherLocale, type Locale } from "@/lib/i18n/config";
import { IconBag, IconClose, IconMenu, BrandSeal } from "@/components/ui/icons";

export interface HeaderLabels {
  brandName: string;
  brandLatin: string;
  nav: { href: string; label: string }[];
  cart: string;
  switchLocale: string;
  switchLocaleLabel: string;
  openMenu: string;
  closeMenu: string;
  mainNav: string;
}

export function Header({ locale, labels }: { locale: Locale; labels: HeaderLabels }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart, hydrated } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const target = otherLocale(locale);
  const switchedPath = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), `/${target}`) || `/${target}`;

  const rememberLocale = () => {
    document.cookie = `NEXT_LOCALE=${target};path=/;max-age=31536000;samesite=lax`;
  };

  const isActive = (href: string) =>
    href === `/${locale}` ? pathname === href : pathname.startsWith(href);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-[var(--duration-stately)] ${
        scrolled || menuOpen
          ? "bg-surface/95 backdrop-blur-sm hairline-b"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        {/* Wordmark */}
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-3 text-text hover:text-accent-light"
        >
          <BrandSeal className="size-6 text-accent" />
          <span className="flex flex-col leading-none">
            <span lang="ar" className="font-display text-xl">
              شالواني
            </span>
            <span
              lang="en"
              className="font-display text-[0.62rem] tracking-[0.4em] uppercase text-text-dim group-hover:text-accent-light"
            >
              Shalwani
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label={labels.mainNav} className="hidden md:block">
          <ul className="flex items-center gap-8">
            {labels.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`font-body text-base tracking-wide pb-1 border-b ${
                    isActive(item.href)
                      ? "text-accent-light border-accent"
                      : "text-text border-transparent hover:text-accent-light hover:border-surface-muted"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <Link
            href={switchedPath}
            onClick={rememberLocale}
            aria-label={labels.switchLocaleLabel}
            lang={target}
            className="px-3 py-2 font-body text-sm tracking-wide text-text-dim hover:text-accent-light border border-transparent hover:border-surface-muted rounded-[var(--radius-soft)]"
          >
            {labels.switchLocale}
          </Link>

          {/* Cart */}
          <button
            type="button"
            onClick={openCart}
            aria-label={labels.cart}
            data-testid="cart-button"
            className="relative p-2.5 text-text hover:text-accent-light rounded-[var(--radius-soft)] cursor-pointer"
          >
            <IconBag className="size-5.5" />
            {hydrated && count > 0 ? (
              <span
                data-testid="cart-count"
                className="absolute -top-0.5 -end-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-text-on-accent text-[0.65rem] font-body tabular"
              >
                {count}
              </span>
            ) : null}
          </button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="p-2.5 text-text hover:text-accent-light md:hidden cursor-pointer"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? labels.closeMenu : labels.openMenu}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconClose className="size-5.5" /> : <IconMenu className="size-5.5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <nav
        id="mobile-nav"
        aria-label={labels.mainNav}
        className={`md:hidden overflow-hidden bg-surface transition-[max-height] duration-[var(--duration-stately)] ease-[var(--ease-luxe)] ${
          menuOpen ? "max-h-96 hairline-b" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col px-5 py-4">
          {labels.nav.map((item) => (
            <li key={item.href} className="hairline-b last:border-b-0">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`block py-3.5 font-body text-lg ${
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
