"use client";

import type { GiftAddon } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import { baisaToOmr } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

export function GiftAddonForm({
  dict,
  action,
  addon,
  showError = false,
}: {
  dict: Dictionary;
  action: (formData: FormData) => Promise<void>;
  addon?: GiftAddon;
  showError?: boolean;
}) {
  const t = dict.admin.giftAddons.form;

  return (
    <form action={action} className="flex max-w-md flex-col gap-5">
      {showError ? (
        <p role="alert" className="border border-accent-secondary px-4 py-3 text-sm text-accent-secondary">
          {t.errors.generic}
        </p>
      ) : null}

      <div>
        <Label htmlFor="ga-nameAr">{t.nameAr}</Label>
        <TextInput
          id="ga-nameAr"
          name="nameAr"
          lang="ar"
          dir="rtl"
          required
          minLength={1}
          defaultValue={addon?.nameAr}
          data-testid="ga-nameAr"
        />
      </div>
      <div>
        <Label htmlFor="ga-nameEn">{t.nameEn}</Label>
        <TextInput
          id="ga-nameEn"
          name="nameEn"
          lang="en"
          dir="ltr"
          required
          minLength={1}
          defaultValue={addon?.nameEn}
          data-testid="ga-nameEn"
        />
      </div>
      <div>
        <Label htmlFor="ga-price">{t.priceOmr}</Label>
        <TextInput
          id="ga-price"
          name="priceOmr"
          dir="ltr"
          inputMode="decimal"
          required
          pattern="\d+(\.\d{1,3})?"
          defaultValue={addon ? baisaToOmr(addon.priceBaisa).toFixed(3) : ""}
          placeholder="3.000"
          data-testid="ga-price"
        />
        <p className="mt-1.5 text-xs text-text-dim">{t.priceHint}</p>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer">
        <input
          type="checkbox"
          name="active"
          defaultChecked={addon?.active ?? true}
          className="size-4 accent-[var(--color-accent)]"
        />
        {t.active}
      </label>

      <Button type="submit" variant="primary" className="self-start" data-testid="ga-save">
        {t.save}
      </Button>
    </form>
  );
}
