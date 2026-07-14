"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart";
import { formatOmr } from "@/lib/money";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldError, Label, TextArea, TextInput } from "@/components/ui/Field";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Errors = Partial<Record<"name" | "phone" | "address" | "form", string>>;

export function CheckoutForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { items, subtotalBaisa, hydrated } = useCart();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const t = dict.checkout;

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
        <div className="flex items-center justify-between">
          <span className="text-text-dim">{t.total}</span>
          <span className="font-heading text-2xl text-text tabular" dir="ltr" data-testid="checkout-total">
            {formatOmr(subtotalBaisa, locale)}
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
