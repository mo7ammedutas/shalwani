"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatOmr } from "@/lib/money";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/Button";
import { IconMinus, IconPlus } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CartPageContent({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { items, subtotalBaisa, setQuantity, removeItem, hydrated } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-5 md:px-8 pt-10 pb-20 flex flex-col gap-12">
      <SectionHeading as="h1" title={dict.cart.title} />

      {!hydrated ? null : items.length === 0 ? (
        <div className="flex flex-col items-start gap-6 py-8">
          <p className="text-text-dim">{dict.cart.empty}</p>
          <ButtonLink href={`/${locale}/shop`} variant="quiet">
            {dict.cart.emptyCta}
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="flex flex-col hairline-b">
            {items.map((item) => {
              const name = locale === "ar" ? item.nameAr : item.nameEn;
              return (
                <li key={item.slug} className="grid grid-cols-[auto_1fr] gap-5 py-7 hairline-t sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <Link
                    href={`/${locale}/shop/${item.slug}`}
                    className="relative block h-28 w-22 overflow-hidden rounded-[var(--radius-soft)] border border-surface-muted"
                  >
                    <Image src={item.image} alt={name} fill sizes="88px" className="object-cover" />
                  </Link>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/${locale}/shop/${item.slug}`}
                      className="font-heading text-lg text-text hover:text-accent-light"
                    >
                      {name}
                    </Link>
                    <span className="tabular text-sm text-text-dim" dir="ltr">
                      {formatOmr(item.priceBaisa, locale)}
                    </span>
                    <div className="mt-1 flex items-center gap-4">
                      <div className="flex items-center border border-surface-muted rounded-[var(--radius-soft)]">
                        <button
                          type="button"
                          aria-label={dict.cart.decrease}
                          onClick={() => setQuantity(item.slug, item.quantity - 1)}
                          className="p-2.5 text-text-dim hover:text-accent-light cursor-pointer"
                        >
                          <IconMinus className="size-4" />
                        </button>
                        <span className="w-9 text-center tabular">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={dict.cart.increase}
                          onClick={() => setQuantity(item.slug, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="p-2.5 text-text-dim hover:text-accent-light disabled:opacity-40 cursor-pointer"
                        >
                          <IconPlus className="size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.slug)}
                        className="text-sm text-text-dim hover:text-accent-secondary underline underline-offset-4 cursor-pointer"
                      >
                        {dict.cart.remove}
                      </button>
                    </div>
                  </div>

                  <span
                    className="tabular text-base text-surface-cream justify-self-end col-start-2 sm:col-start-3"
                    dir="ltr"
                  >
                    {formatOmr(item.priceBaisa * item.quantity, locale)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col items-end gap-5">
            <div className="flex items-baseline gap-6">
              <span className="text-text-dim">{dict.cart.subtotal}</span>
              <span className="font-heading text-2xl text-text tabular" dir="ltr" data-testid="cart-page-subtotal">
                {formatOmr(subtotalBaisa, locale)}
              </span>
            </div>
            <p className="text-sm text-text-dim">{dict.cart.shippingNote}</p>
            <div className="flex flex-wrap gap-4">
              <ButtonLink href={`/${locale}/shop`} variant="quiet">
                {dict.cart.continueShopping}
              </ButtonLink>
              <ButtonLink href={`/${locale}/checkout`} variant="primary" data-testid="to-checkout">
                {dict.cart.checkout}
              </ButtonLink>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
