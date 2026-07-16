"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/settings";
import { ACCENT_PRESETS, type AccentPreset } from "@/lib/settings-presets";
import { baisaToOmr } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

export function SettingsForm({
  dict,
  action,
  settings,
}: {
  dict: Dictionary;
  action: (formData: FormData) => Promise<void>;
  settings: SiteSettings;
}) {
  const t = dict.admin.settings;
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickLogo(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { path?: string };
      if (res.ok && data.path) setLogoUrl(data.path);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-12">
      <input type="hidden" name="logoUrl" value={logoUrl} />

      <fieldset className="flex flex-col gap-5">
        <legend className="font-heading text-lg text-text mb-2">{t.brandingTitle}</legend>

        <div className="flex flex-col gap-3">
          <Label htmlFor="logo-file">{t.logo}</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <span className="relative block h-16 w-16 overflow-hidden border border-surface-muted bg-surface">
                <Image src={logoUrl} alt="" fill sizes="64px" className="object-contain" />
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="border border-dashed border-surface-muted px-4 py-2.5 text-sm text-text-dim hover:border-accent-light hover:text-accent-light disabled:opacity-50 cursor-pointer"
              data-testid="settings-upload-logo"
            >
              {uploading ? t.uploading : t.uploadLogo}
            </button>
            {logoUrl ? (
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="text-sm text-accent-secondary underline underline-offset-4 cursor-pointer"
              >
                {t.removeLogo}
              </button>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onPickLogo(file);
              }}
            />
          </div>
          <p className="text-xs text-text-dim">{t.logoHint}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="accent-0">{t.accentColor}</Label>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(ACCENT_PRESETS) as AccentPreset[]).map((key, i) => (
              <label
                key={key}
                className="flex cursor-pointer flex-col items-center gap-2 text-xs text-text-dim"
              >
                <input
                  id={`accent-${i}`}
                  type="radio"
                  name="accentPreset"
                  value={key}
                  defaultChecked={settings.accentPreset === key}
                  className="sr-only peer"
                  data-testid={`accent-${key}`}
                />
                <span
                  aria-hidden
                  className="block size-9 rounded-full border-2 border-transparent peer-checked:border-accent-light peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent-light"
                  style={{ backgroundColor: ACCENT_PRESETS[key].accent }}
                />
                {t.accentPresets[key] ?? key}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 hairline-t pt-8">
        <legend className="font-heading text-lg text-text mb-2">{t.contactTitle}</legend>
        <div>
          <Label htmlFor="contactEmail">{t.contactEmail}</Label>
          <TextInput
            id="contactEmail"
            name="contactEmail"
            type="email"
            dir="ltr"
            defaultValue={settings.contactEmail}
            data-testid="settings-contact-email"
          />
        </div>
        <div>
          <Label htmlFor="whatsappUrl">{t.whatsappUrl}</Label>
          <TextInput
            id="whatsappUrl"
            name="whatsappUrl"
            type="url"
            dir="ltr"
            defaultValue={settings.whatsappUrl}
            data-testid="settings-whatsapp-url"
          />
          <p className="mt-1.5 text-xs text-text-dim">{t.whatsappHint}</p>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5 hairline-t pt-8">
        <legend className="font-heading text-lg text-text mb-2">{t.commerceTitle}</legend>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label htmlFor="vatRatePercent">{t.vatRate}</Label>
            <TextInput
              id="vatRatePercent"
              name="vatRatePercent"
              type="number"
              min={0}
              max={100}
              step="0.1"
              dir="ltr"
              defaultValue={settings.vatRatePercent}
              data-testid="settings-vat-rate"
            />
            <p className="mt-1.5 text-xs text-text-dim">{t.vatRateHint}</p>
          </div>
          <div>
            <Label htmlFor="gulfShippingFeeOmr">{t.gulfShippingFee}</Label>
            <TextInput
              id="gulfShippingFeeOmr"
              name="gulfShippingFeeOmr"
              dir="ltr"
              inputMode="decimal"
              pattern="\d+(\.\d{1,3})?"
              defaultValue={baisaToOmr(settings.gulfShippingFeeBaisa).toFixed(3)}
              data-testid="settings-gulf-fee"
            />
            <p className="mt-1.5 text-xs text-text-dim">{t.gulfShippingFeeHint}</p>
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 hairline-t pt-8">
        <legend className="font-heading text-lg text-text mb-2">{t.paymentTitle}</legend>
        <p className="text-sm text-text-dim">{t.paymentNote}</p>
      </fieldset>

      <Button type="submit" variant="primary" className="self-start" data-testid="settings-save">
        {t.save}
      </Button>
    </form>
  );
}
