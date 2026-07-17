"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import type { GiftAddon } from "@prisma/client";
import { useCart } from "@/lib/cart";
import { formatOmr } from "@/lib/money";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { SHIPPING_FEE_BAISA, type ShippingZone } from "@/lib/shipping";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldError, Label, TextArea, TextInput } from "@/components/ui/Field";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Errors = Partial<Record<"name" | "phone" | "address" | "form", string>>;

interface CouponQuote {
  code: string;
  kind: string;
  discountBaisa: number;
  freeShipping: boolean;
}

const POINT_VALUE_BAISA = 10; // keep in sync with @/lib/loyalty

export function CheckoutForm({
  locale,
  dict,
  giftAddons,
  customer,
  gulfShippingFeeBaisa = SHIPPING_FEE_BAISA.gulf,
  vatRate = 0,
  vatRatePercent = 0,
}: {
  locale: Locale;
  dict: Dictionary;
  giftAddons: GiftAddon[];
  /** Pre-fills contact fields when the shopper is logged in. */
  customer?: { name: string; phone: string; email: string | null; loyaltyPoints?: number } | null;
  /** Merchant-configured (Settings → Shipping & tax); falls back to the
   * code default so the form still works before any settings are saved. */
  gulfShippingFeeBaisa?: number;
  vatRate?: number;
  vatRatePercent?: number;
}) {
  const { items, subtotalBaisa, hydrated } = useCart();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [shippingZone, setShippingZone] = useState<ShippingZone>("oman");
  const [isGift, setIsGift] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [couponQuote, setCouponQuote] = useState<CouponQuote | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const t = dict.checkout;

  const loyaltyBalance = customer?.loyaltyPoints ?? 0;

  const addonsTotal = useMemo(
    () =>
      isGift
        ? giftAddons
            .filter((a) => selectedAddonIds.includes(a.id))
            .reduce((sum, a) => sum + a.priceBaisa, 0)
        : 0,
    [isGift, selectedAddonIds, giftAddons],
  );
  const goodsSubtotal = subtotalBaisa + addonsTotal;
  // Mirror of the server's discount math — the server recomputes everything.
  const couponDiscount = couponQuote ? Math.min(couponQuote.discountBaisa, goodsSubtotal) : 0;
  const loyaltyDiscount = redeemPoints
    ? Math.min(loyaltyBalance * POINT_VALUE_BAISA, goodsSubtotal - couponDiscount)
    : 0;
  const discountedGoods = goodsSubtotal - couponDiscount - loyaltyDiscount;
  const shippingFee = couponQuote?.freeShipping
    ? 0
    : shippingZone === "gulf"
      ? gulfShippingFeeBaisa
      : SHIPPING_FEE_BAISA.oman;
  const vatBaisa = Math.round(discountedGoods * vatRate);
  const grandTotal = discountedGoods + shippingFee + vatBaisa;

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotalBaisa: goodsSubtotal }),
      });
      const data = (await res.json()) as
        | { ok: true; code: string; kind: string; discountBaisa: number; freeShipping: boolean }
        | { ok: false; reason?: string };
      if (!("ok" in data) || !data.ok) {
        setCouponQuote(null);
        setCouponError(
          t.coupon.errors[("reason" in data && data.reason) || "not_found"] ??
            t.coupon.errors.not_found,
        );
        return;
      }
      setCouponQuote(data);
    } catch {
      setCouponQuote(null);
      setCouponError(t.coupon.errors.not_found);
    } finally {
      setCouponBusy(false);
    }
  }

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (hydrated && items.length === 0 && !submitting) {
    return (
      <div className="flex flex-col items-start gap-6">
        <p className="text-text-dim">{t.errors.cartEmpty}</p>
        <ButtonLink href={`/${locale}/shop`} variant="quiet">
          {dict.cart.emptyCta}
        </ButtonLink>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    const recipientName = String(form.get("recipientName") ?? "").trim();
    const giftMessage = String(form.get("giftMessage") ?? "").trim();

    const next: Errors = {};
    if (name.length < 2) next.name = t.errors.nameRequired;
    if (!/^[+\d][\d\s-]{6,}$/.test(phone)) next.phone = t.errors.phoneRequired;
    if (address.length < 4) next.address = t.errors.addressRequired;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          customer: { name, phone, email },
          address,
          notes,
          items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
          shippingZone,
          isGift,
          giftMessage: isGift ? giftMessage : undefined,
          recipientName: isGift ? recipientName : undefined,
          giftAddonIds: isGift ? selectedAddonIds : [],
          couponCode: couponQuote?.code,
          redeemPoints,
        }),
      });
      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        setSubmitting(false);
        setErrors({
          form: data.error === "insufficient_stock" ? t.errors.stock : t.errors.generic,
        });
        return;
      }
      window.location.assign(data.redirectUrl);
    } catch {
      setSubmitting(false);
      setErrors({ form: t.errors.generic });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-14 lg:grid-cols-[7fr_5fr] items-start">
      <div className="flex flex-col gap-10">
        <fieldset className="flex flex-col gap-5">
          <legend className="font-heading text-xl text-text mb-5">{t.contactTitle}</legend>
          <div>
            <Label htmlFor="co-name">{t.name}</Label>
            <TextInput
              id="co-name"
              name="name"
              autoComplete="name"
              defaultValue={customer?.name ?? ""}
              placeholder={t.namePlaceholder}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "co-name-err" : undefined}
              data-testid="checkout-name"
            />
            <FieldError id="co-name-err" message={errors.name} />
          </div>
          <div>
            <Label htmlFor="co-phone">{t.phone}</Label>
            <TextInput
              id="co-phone"
              name="phone"
              type="tel"
              dir="ltr"
              autoComplete="tel"
              defaultValue={customer?.phone ?? ""}
              placeholder={t.phonePlaceholder}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "co-phone-err" : undefined}
              data-testid="checkout-phone"
            />
            <FieldError id="co-phone-err" message={errors.phone} />
          </div>
          <div>
            <Label htmlFor="co-email">{t.email}</Label>
            <TextInput
              id="co-email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              defaultValue={customer?.email ?? ""}
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-5 hairline-t pt-8">
          <legend className="sr-only">{t.deliveryTitle}</legend>
          <h2 className="font-heading text-xl text-text">{t.deliveryTitle}</h2>
          <div>
            <Label htmlFor="co-address">{t.address}</Label>
            <TextArea
              id="co-address"
              name="address"
              rows={3}
              autoComplete="street-address"
              placeholder={t.addressPlaceholder}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? "co-address-err" : undefined}
              data-testid="checkout-address"
            />
            <FieldError id="co-address-err" message={errors.address} />
          </div>
          <div>
            <Label htmlFor="co-notes">{t.notes}</Label>
            <TextArea id="co-notes" name="notes" rows={2} placeholder={t.notesPlaceholder} />
          </div>

          {/* Shipping zone */}
          <fieldset className="flex flex-col gap-3 pt-2">
            <legend className="mb-1 text-sm tracking-wide text-text-dim">{t.shipping.title}</legend>
            <div className="flex flex-col gap-2.5">
              {(["oman", "gulf"] as ShippingZone[]).map((zone) => (
                <label
                  key={zone}
                  className="flex cursor-pointer items-start gap-3 border border-surface-muted px-4 py-3 has-[:checked]:border-accent-light"
                >
                  <input
                    type="radio"
                    name="shippingZoneChoice"
                    value={zone}
                    checked={shippingZone === zone}
                    onChange={() => setShippingZone(zone)}
                    className="mt-1 accent-[var(--color-accent)]"
                    data-testid={`shipping-${zone}`}
                  />
                  <span className="flex flex-col">
                    <span className="text-base text-text">
                      {zone === "oman" ? t.shipping.oman : t.shipping.gulf}
                    </span>
                    <span className="text-sm text-text-dim">
                      {zone === "oman"
                        ? t.shipping.omanNote
                        : `${t.shipping.gulfNote} — ${formatOmr(gulfShippingFeeBaisa, locale)}`}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </fieldset>

        {/* Gift */}
        <fieldset className="flex flex-col gap-5 hairline-t pt-8">
          <legend className="sr-only">{t.gift.toggle}</legend>
          <label className="flex items-center gap-3 text-lg text-text cursor-pointer">
            <input
              type="checkbox"
              checked={isGift}
              onChange={(e) => setIsGift(e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
              data-testid="gift-toggle"
            />
            {t.gift.toggle}
          </label>

          {isGift ? (
            <div className="flex flex-col gap-5 ps-1">
              {giftAddons.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  <span className="text-sm tracking-wide text-text-dim">{t.gift.addonsTitle}</span>
                  {giftAddons.map((addon) => (
                    <label
                      key={addon.id}
                      className="flex cursor-pointer items-center justify-between gap-3 border border-surface-muted px-4 py-3 has-[:checked]:border-accent-light"
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAddonIds.includes(addon.id)}
                          onChange={() => toggleAddon(addon.id)}
                          className="size-4 accent-[var(--color-accent)]"
                          data-testid={`addon-${addon.slug}`}
                        />
                        <span className="text-base text-text">
                          {locale === "ar" ? addon.nameAr : addon.nameEn}
                        </span>
                      </span>
                      <span className="tabular text-sm text-text-dim" dir="ltr">
                        {formatOmr(addon.priceBaisa, locale)}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}

              <div>
                <Label htmlFor="co-recipient">{t.gift.recipientName}</Label>
                <TextInput
                  id="co-recipient"
                  name="recipientName"
                  placeholder={t.gift.recipientNamePlaceholder}
                  data-testid="gift-recipient"
                />
              </div>
              <div>
                <Label htmlFor="co-gift-message">{t.gift.messageLabel}</Label>
                <TextArea
                  id="co-gift-message"
                  name="giftMessage"
                  rows={3}
                  maxLength={500}
                  placeholder={t.gift.messagePlaceholder}
                  data-testid="gift-message"
                />
              </div>
            </div>
          ) : null}
        </fieldset>
      </div>

      {/* Order summary */}
      <aside className="flex flex-col gap-6 rounded-[var(--radius-soft)] border border-surface-muted bg-surface p-7 lg:sticky lg:top-24">
        <SectionHeading as="h3" title={t.summaryTitle} />
        <ul className="flex flex-col hairline-b">
          {items.map((item) => {
            const name = locale === "ar" ? item.nameAr : item.nameEn;
            return (
              <li key={item.slug} className="flex items-center gap-4 py-4 hairline-t">
                <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-[var(--radius-soft)] border border-surface-muted">
                  <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                </span>
                <span className="flex-1 text-sm text-text leading-snug">
                  {name}
                  <span className="text-text-dim"> × {item.quantity}</span>
                </span>
                <span className="tabular text-sm text-text-dim" dir="ltr">
                  {formatOmr(item.priceBaisa * item.quantity, locale)}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Coupon */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="co-coupon">{t.coupon.label}</Label>
          {couponQuote ? (
            <div className="flex items-center justify-between gap-3 border border-accent-light px-3 py-2.5 text-sm">
              <span className="text-accent-light">
                {t.coupon.applied}: <span dir="ltr" className="tabular">{couponQuote.code}</span>
                {couponQuote.freeShipping ? ` — ${t.coupon.freeShippingNote}` : ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCouponQuote(null);
                  setCouponInput("");
                }}
                className="text-text-dim underline underline-offset-4 cursor-pointer"
                data-testid="coupon-remove"
              >
                {t.coupon.remove}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <TextInput
                id="co-coupon"
                dir="ltr"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder={t.coupon.placeholder}
                className="uppercase"
                data-testid="coupon-input"
              />
              <Button
                type="button"
                variant="quiet"
                onClick={applyCoupon}
                disabled={couponBusy || !couponInput.trim()}
                data-testid="coupon-apply"
              >
                {t.coupon.apply}
              </Button>
            </div>
          )}
          {couponError ? (
            <p role="alert" className="text-sm text-accent-secondary" data-testid="coupon-error">
              {couponError}
            </p>
          ) : null}
        </div>

        {/* Loyalty redemption */}
        {customer && loyaltyBalance > 0 ? (
          <label className="flex items-start gap-3 text-sm cursor-pointer" data-testid="loyalty-toggle-label">
            <input
              type="checkbox"
              checked={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--color-accent)]"
              data-testid="loyalty-toggle"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-text">{t.loyalty.toggle}</span>
              <span className="text-text-dim">
                {t.loyalty.balance.replace("{points}", String(loyaltyBalance))} · {t.loyalty.value}
              </span>
            </span>
          </label>
        ) : null}

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-dim">{t.subtotal}</span>
            <span className="tabular text-text" dir="ltr">
              {formatOmr(subtotalBaisa, locale)}
            </span>
          </div>
          {isGift && addonsTotal > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-dim">{t.gift.lineLabel}</span>
              <span className="tabular text-text" dir="ltr" data-testid="addons-total">
                {formatOmr(addonsTotal, locale)}
              </span>
            </div>
          ) : null}
          {shippingFee > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-dim">{t.gift.shippingLine}</span>
              <span className="tabular text-text" dir="ltr" data-testid="shipping-fee">
                {formatOmr(shippingFee, locale)}
              </span>
            </div>
          ) : null}
          {couponDiscount > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-dim">
                {t.discountLabel} (<span dir="ltr">{couponQuote?.code}</span>)
              </span>
              <span className="tabular text-accent-light" dir="ltr" data-testid="coupon-discount">
                −{formatOmr(couponDiscount, locale)}
              </span>
            </div>
          ) : null}
          {loyaltyDiscount > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-dim">{t.loyalty.applied}</span>
              <span className="tabular text-accent-light" dir="ltr" data-testid="loyalty-discount">
                −{formatOmr(loyaltyDiscount, locale)}
              </span>
            </div>
          ) : null}
          {vatBaisa > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-dim">
                {t.vatLabel} ({vatRatePercent}%)
              </span>
              <span className="tabular text-text" dir="ltr" data-testid="vat-amount">
                {formatOmr(vatBaisa, locale)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between hairline-t pt-4">
          <span className="text-text-dim">{t.total}</span>
          <span className="font-heading text-2xl text-text tabular" dir="ltr" data-testid="checkout-total">
            {formatOmr(grandTotal, locale)}
          </span>
        </div>
        {errors.form ? (
          <p role="alert" className="text-sm text-accent-light border border-accent-secondary/60 rounded-[var(--radius-soft)] px-4 py-3">
            {errors.form}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || !hydrated}
          className="w-full"
          data-testid="pay-now"
        >
          {submitting ? t.processing : t.payNow}
        </Button>
        <p className="text-sm text-text-dim leading-relaxed">{t.secureNote}</p>
      </aside>
    </form>
  );
}
