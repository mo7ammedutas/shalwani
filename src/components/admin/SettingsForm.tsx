"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { SiteSettings } from "@/lib/settings";
import { ACCENT_PRESETS, type AccentPreset } from "@/lib/settings-presets";
import { baisaToOmr } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

/** One admin-managed image slot: preview, upload to /api/admin/upload,
 * remove, and a hidden input carrying the URL into the settings action. */
function ImageSlot({
  name,
  label,
  hint,
  value,
  onChange,
  uploadLabel,
  uploadingLabel,
  removeLabel,
  previewClass = "h-16 w-16",
  testId,
}: {
  name: string;
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
  uploadLabel: string;
  uploadingLabel: string;
  removeLabel: string;
  previewClass?: string;
  testId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { path?: string };
      if (res.ok && data.path) onChange(data.path);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={value} />
      <Label htmlFor={`${name}-file`}>{label}</Label>
      <div className="flex items-center gap-4">
        {value ? (
          <span
            className={`relative block overflow-hidden border border-surface-muted bg-surface ${previewClass}`}
          >
            <Image src={value} alt="" fill sizes="160px" className="object-cover" />
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="border border-dashed border-surface-muted px-4 py-2.5 text-sm text-text-dim hover:border-accent-light hover:text-accent-light disabled:opacity-50 cursor-pointer"
          data-testid={testId}
        >
          {uploading ? uploadingLabel : uploadLabel}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-accent-secondary underline underline-offset-4 cursor-pointer"
          >
            {removeLabel}
          </button>
        ) : null}
        <input
          ref={fileRef}
          id={`${name}-file`}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPick(file);
          }}
        />
      </div>
      <p className="text-xs text-text-dim">{hint}</p>
    </div>
  );
}

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
  const [heroImageUrl, setHeroImageUrl] = useState(settings.heroImageUrl);
  const [storyTeaserImageUrl, setStoryTeaserImageUrl] = useState(settings.storyTeaserImageUrl);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-12">
      <fieldset className="flex flex-col gap-5">
        <legend className="font-heading text-lg text-text mb-2">{t.brandingTitle}</legend>

        <ImageSlot
          name="logoUrl"
          label={t.logo}
          hint={t.logoHint}
          value={logoUrl}
          onChange={setLogoUrl}
          uploadLabel={t.uploadLogo}
          uploadingLabel={t.uploading}
          removeLabel={t.removeLogo}
          previewClass="h-16 w-16"
          testId="settings-upload-logo"
        />

        <ImageSlot
          name="heroImageUrl"
          label={t.heroImage}
          hint={t.heroImageHint}
          value={heroImageUrl}
          onChange={setHeroImageUrl}
          uploadLabel={t.uploadImage}
          uploadingLabel={t.uploading}
          removeLabel={t.removeImage}
          previewClass="h-16 w-28"
          testId="settings-upload-hero"
        />

        <ImageSlot
          name="storyTeaserImageUrl"
          label={t.storyTeaserImage}
          hint={t.storyTeaserImageHint}
          value={storyTeaserImageUrl}
          onChange={setStoryTeaserImageUrl}
          uploadLabel={t.uploadImage}
          uploadingLabel={t.uploading}
          removeLabel={t.removeImage}
          previewClass="h-16 w-[85px]"
          testId="settings-upload-story"
        />

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

      <fieldset className="flex flex-col gap-5 hairline-t pt-8">
        <legend className="font-heading text-lg text-text mb-2">{t.loyaltyTitle}</legend>
        <div className="max-w-56">
          <Label htmlFor="loyaltyPointsPerOmr">{t.loyaltyRate}</Label>
          <TextInput
            id="loyaltyPointsPerOmr"
            name="loyaltyPointsPerOmr"
            type="number"
            min={0}
            step={1}
            dir="ltr"
            defaultValue={settings.loyaltyPointsPerOmr}
            data-testid="settings-loyalty-rate"
          />
          <p className="mt-1.5 text-xs text-text-dim">{t.loyaltyRateHint}</p>
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
