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

export function CheckoutForm({
  locale,
  dict,
  giftAddons,
}: {
  locale: Locale;
  dict: Dictionary;
  giftAddons: GiftAddon[];
}) {
  const { items, subtotalBaisa, hydrated } = useCart();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [shippingZone, setShippingZone] = useState<ShippingZone>("oman");
  const [isGift, setIsGift] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const t = dict.checkout;

  const addonsTotal = useMemo(
    () =>
      isGift
        ? giftAddons
            .filter((a) => selectedAddonIds.includes(a.id))
            .reduce((sum, a) => sum + a.priceBaisa, 0)
        : 0,
    [isGift, selectedAddonIds, giftAddons],
  );
  const shippingFee = SHIPPING_FEE_BAISA[shippingZone];
  const grandTotal = subtotalBaisa + addonsTotal + shippingFee;

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
              placeholder={t.phonePlaceholder}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "co-phone-err" : undefined}
              data-testid="checkout-phone"
            />
            <FieldError id="co-phone-err" message={errors.phone} />
          </div>
          <div>
            <Label htmlFor="co-email">{t.email}</Label>
            <TextInput id="co-email" name="email" type="email" dir="ltr" autoComplete="email" />
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
                        : `${t.shipping.gulfNote} — ${formatOmr(SHIPPING_FEE_BAISA.gulf, locale)}`}
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
