"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { formatOmr } from "@/lib/money";
import type { Locale } from "@/lib/i18n/config";
import { IconClose, IconMinus, IconPlus } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/Button";

export interface CartLabels {
  drawerTitle: string;
  empty: string;
  emptyCta: string;
  remove: string;
  increase: string;
  decrease: string;
  subtotal: string;
  checkout: string;
  close: string;
  shippingNote: string;
}

export function CartDrawer({ locale, labels }: { locale: Locale; labels: CartLabels }) {
  const { items, subtotalBaisa, isOpen, closeCart, setQuantity, removeItem } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <div aria-hidden={!isOpen} inert={!isOpen} className={isOpen ? "" : "pointer-events-none"}>
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--color-bg)_75%,transparent)] transition-opacity duration-[var(--duration-calm)] ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.drawerTitle}
        tabIndex={-1}
        data-testid="cart-drawer"
        className={`fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-surface border-s border-surface-muted transition-transform duration-[var(--duration-stately)] ease-[var(--ease-luxe)] ${
          isOpen ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 hairline-b">
          <h2 className="font-heading text-xl text-text">{labels.drawerTitle}</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={labels.close}
            className="p-2 text-text-dim hover:text-accent-light cursor-pointer"
          >
            <IconClose className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-text-dim">{labels.empty}</p>
            <ButtonLink href={`/${locale}/shop`} variant="quiet" onClick={closeCart}>
              {labels.emptyCta}
            </ButtonLink>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
              {items.map((item) => {
                const name = locale === "ar" ? item.nameAr : item.nameEn;
                return (
                  <li key={item.slug} className="flex gap-4 py-5 hairline-b last:border-b-0">
                    <Link
                      href={`/${locale}/shop/${item.slug}`}
                      onClick={closeCart}
                      className="relative block h-24 w-20 shrink-0 overflow-hidden rounded-[var(--radius-soft)] border border-surface-muted"
                    >
                      <Image src={item.image} alt={name} fill sizes="80px" className="object-cover" />
                    </Link>
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-heading text-base text-text leading-snug">{name}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.slug)}
                          className="text-sm text-text-dim hover:text-accent-secondary underline underline-offset-4 cursor-pointer"
                        >
                          {labels.remove}
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-surface-muted rounded-[var(--radius-soft)]">
                          <button
                            type="button"
                            aria-label={labels.decrease}
                            onClick={() => setQuantity(item.slug, item.quantity - 1)}
                            className="p-2 text-text-dim hover:text-accent-light cursor-pointer"
                          >
                            <IconMinus className="size-3.5" />
                          </button>
                          <span className="w-8 text-center tabular text-sm" data-testid={`qty-${item.slug}`}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={labels.increase}
                            onClick={() => setQuantity(item.slug, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="p-2 text-text-dim hover:text-accent-light disabled:opacity-40 cursor-pointer"
                          >
                            <IconPlus className="size-3.5" />
                          </button>
                        </div>
                        <span className="tabular text-sm text-text" dir="ltr">
                          {formatOmr(item.priceBaisa * item.quantity, locale)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="px-6 py-6 hairline-t flex flex-col gap-4 bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-text-dim">{labels.subtotal}</span>
                <span className="font-heading text-xl text-text tabular" dir="ltr" data-testid="cart-subtotal">
                  {formatOmr(subtotalBaisa, locale)}
                </span>
              </div>
              <p className="text-sm text-text-dim leading-relaxed">{labels.shippingNote}</p>
              <ButtonLink
                href={`/${locale}/checkout`}
                variant="primary"
                className="w-full"
                onClick={closeCart}
                data-testid="drawer-checkout"
              >
                {labels.checkout}
              </ButtonLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
