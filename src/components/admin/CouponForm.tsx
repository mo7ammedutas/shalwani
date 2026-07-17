"use client";

import { useState } from "react";
import type { Coupon } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import { baisaToOmr } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

export function CouponForm({
  dict,
  action,
  coupon,
  error,
}: {
  dict: Dictionary;
  action: (formData: FormData) => Promise<void>;
  coupon?: Coupon;
  error?: string;
}) {
  const t = dict.admin.coupons.form;
  const kinds = dict.admin.coupons.kinds;
  const [kind, setKind] = useState<string>(coupon?.kind ?? "percent");

  return (
    <form action={action} className="flex max-w-md flex-col gap-5">
      {error ? (
        <p role="alert" className="border border-accent-secondary px-4 py-3 text-sm text-accent-secondary">
          {error === "duplicate" ? t.errors.duplicate : t.errors.generic}
        </p>
      ) : null}

      <div>
        <Label htmlFor="cp-code">{t.code}</Label>
        <TextInput
          id="cp-code"
          name="code"
          dir="ltr"
          required
          minLength={3}
          maxLength={40}
          defaultValue={coupon?.code}
          placeholder="EID25"
          className="uppercase"
          data-testid="cp-code"
        />
        <p className="mt-1.5 text-xs text-text-dim">{t.codeHint}</p>
      </div>

      <div>
        <Label htmlFor="cp-kind">{t.kind}</Label>
        <select
          id="cp-kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-full border border-surface-muted bg-surface px-3 py-2.5 text-sm text-text"
          data-testid="cp-kind"
        >
          <option value="percent">{kinds.percent}</option>
          <option value="fixed">{kinds.fixed}</option>
          <option value="freeShipping">{kinds.freeShipping}</option>
        </select>
      </div>

      {kind !== "freeShipping" ? (
        <div>
          <Label htmlFor="cp-value">{kind === "percent" ? t.valuePercent : t.valueFixed}</Label>
          <TextInput
            id="cp-value"
            name="value"
            dir="ltr"
            inputMode="numeric"
            required
            defaultValue={
              coupon
                ? coupon.kind === "fixed"
                  ? String(baisaToOmr(coupon.value))
                  : String(coupon.value)
                : ""
            }
            placeholder={kind === "percent" ? "10" : "5"}
            data-testid="cp-value"
          />
        </div>
      ) : null}

      <div>
        <Label htmlFor="cp-minOrder">{t.minOrder}</Label>
        <TextInput
          id="cp-minOrder"
          name="minOrderOmr"
          dir="ltr"
          inputMode="decimal"
          pattern="\d*(\.\d{1,3})?"
          defaultValue={
            coupon && coupon.minOrderBaisa > 0 ? baisaToOmr(coupon.minOrderBaisa).toFixed(3) : ""
          }
          placeholder="20.000"
          data-testid="cp-minOrder"
        />
      </div>

      <div>
        <Label htmlFor="cp-maxUses">{t.maxUses}</Label>
        <TextInput
          id="cp-maxUses"
          name="maxUses"
          dir="ltr"
          type="number"
          min={1}
          defaultValue={coupon?.maxUses ?? ""}
          placeholder="100"
          data-testid="cp-maxUses"
        />
      </div>

      <div>
        <Label htmlFor="cp-expiresAt">{t.expiresAt}</Label>
        <TextInput
          id="cp-expiresAt"
          name="expiresAt"
          dir="ltr"
          type="date"
          defaultValue={coupon?.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : ""}
          data-testid="cp-expiresAt"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer">
        <input
          type="checkbox"
          name="active"
          defaultChecked={coupon?.active ?? true}
          className="size-4 accent-[var(--color-accent)]"
        />
        {t.active}
      </label>

      <Button type="submit" variant="primary" className="self-start" data-testid="cp-save">
        {t.save}
      </Button>
    </form>
  );
}
