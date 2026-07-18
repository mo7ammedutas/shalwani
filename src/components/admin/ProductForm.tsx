"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Product } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import { productImagesClient } from "@/lib/product-images";
import { baisaToOmr } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Label, TextArea, TextInput } from "@/components/ui/Field";
import { IconClose, IconPlus } from "@/components/ui/icons";

export function ProductForm({
  dict,
  action,
  product,
  showError,
}: {
  dict: Dictionary;
  action: (formData: FormData) => Promise<void>;
  product?: Product;
  showError?: boolean;
}) {
  const t = dict.admin.form;
  const [images, setImages] = useState<string[]>(
    product ? productImagesClient(product.images) : [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [imageMissing, setImageMissing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(file: File) {
    setUploading(true);
    setUploadError(false);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { path?: string };
      if (!res.ok || !data.path) throw new Error("upload failed");
      setImages((prev) => [...prev, data.path!]);
      setImageMissing(false);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const colorOptions = Object.entries(dict.colors);
  const embroideryOptions = Object.entries(dict.embroidery);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (images.length === 0) {
          e.preventDefault();
          setImageMissing(true);
        }
      }}
      className="flex max-w-3xl flex-col gap-6"
    >
      {showError ? (
        <p role="alert" className="border border-accent-secondary px-4 py-3 text-sm text-accent-secondary">
          {t.errors.generic}
        </p>
      ) : null}

      {/* Category — which of the two massar lines this piece belongs to */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-sm tracking-wide text-text-dim">{t.category}</legend>
        <div className="flex flex-wrap gap-3">
          {(["turma", "bashmina"] as const).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 border border-surface-muted px-4 py-2.5 has-[:checked]:border-accent-light"
            >
              <input
                type="radio"
                name="category"
                value={key}
                defaultChecked={(product?.category ?? "bashmina") === key}
                className="accent-[var(--color-accent)]"
                data-testid={`pf-category-${key}`}
              />
              <span className="text-sm text-text">{t.categories[key]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="pf-nameAr">{t.nameAr}</Label>
          <TextInput id="pf-nameAr" name="nameAr" lang="ar" dir="rtl" required minLength={2} defaultValue={product?.nameAr} data-testid="pf-nameAr" />
        </div>
        <div>
          <Label htmlFor="pf-nameEn">{t.nameEn}</Label>
          <TextInput id="pf-nameEn" name="nameEn" lang="en" dir="ltr" required minLength={2} defaultValue={product?.nameEn} data-testid="pf-nameEn" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="pf-descAr">{t.descriptionAr}</Label>
          <TextArea id="pf-descAr" name="descriptionAr" lang="ar" dir="rtl" required minLength={2} defaultValue={product?.descriptionAr} data-testid="pf-descAr" />
        </div>
        <div>
          <Label htmlFor="pf-descEn">{t.descriptionEn}</Label>
          <TextArea id="pf-descEn" name="descriptionEn" lang="en" dir="ltr" required minLength={2} defaultValue={product?.descriptionEn} data-testid="pf-descEn" />
        </div>
      </div>

      {/* Free-text merchandising fields; datalists offer the existing
          vocabulary as suggestions without restricting input. */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="pf-color">{t.color}</Label>
          <TextInput
            id="pf-color"
            name="color"
            required
            minLength={1}
            maxLength={40}
            list="pf-color-options"
            placeholder={t.colorPlaceholder}
            defaultValue={product ? (dict.colors[product.color] ?? product.color) : ""}
            data-testid="pf-color"
          />
          <datalist id="pf-color-options">
            {colorOptions.map(([value, label]) => (
              <option key={value} value={label} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="pf-embroidery">{t.embroidery}</Label>
          <TextInput
            id="pf-embroidery"
            name="embroidery"
            required
            minLength={1}
            maxLength={40}
            list="pf-embroidery-options"
            placeholder={t.embroideryPlaceholder}
            defaultValue={product ? (dict.embroidery[product.embroidery] ?? product.embroidery) : ""}
            data-testid="pf-embroidery"
          />
          <datalist id="pf-embroidery-options">
            {embroideryOptions.map(([value, label]) => (
              <option key={value} value={label} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="pf-price">{t.priceOmr}</Label>
          <TextInput
            id="pf-price"
            name="priceOmr"
            dir="ltr"
            inputMode="decimal"
            required
            pattern="\d+(\.\d{1,3})?"
            defaultValue={product ? baisaToOmr(product.priceBaisa).toFixed(3) : ""}
            placeholder="32.500"
            data-testid="pf-price"
          />
          <p className="mt-1.5 text-xs text-text-dim">{t.priceHint}</p>
        </div>
        <div>
          <Label htmlFor="pf-original-price">{t.originalPriceOmr}</Label>
          <TextInput
            id="pf-original-price"
            name="originalPriceOmr"
            dir="ltr"
            inputMode="decimal"
            pattern="\d*(\.\d{1,3})?"
            defaultValue={
              product?.originalPriceBaisa != null
                ? baisaToOmr(product.originalPriceBaisa).toFixed(3)
                : ""
            }
            placeholder="45.000"
            data-testid="pf-original-price"
          />
          <p className="mt-1.5 text-xs text-text-dim">{t.originalPriceHint}</p>
        </div>
        <div>
          <Label htmlFor="pf-stock">{t.stock}</Label>
          <TextInput
            id="pf-stock"
            name="stock"
            type="number"
            dir="ltr"
            min={0}
            max={9999}
            required
            defaultValue={product?.stock ?? 1}
            data-testid="pf-stock"
          />
        </div>
      </div>

      {/* Images */}
      <div className="flex flex-col gap-3">
        <span className="block text-sm tracking-wide text-text-dim">{t.images}</span>
        <input type="hidden" name="images" value={JSON.stringify(images)} />
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <span key={`${src}-${i}`} className="relative block h-24 w-24 overflow-hidden border border-surface-muted bg-surface">
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              <button
                type="button"
                aria-label={t.removeImage}
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 end-1 bg-bg/90 p-0.5 text-accent-secondary cursor-pointer"
              >
                <IconClose className="size-3.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 border border-dashed border-surface-muted text-text-dim hover:border-accent-light hover:text-accent-light disabled:opacity-50 cursor-pointer"
            data-testid="pf-upload"
          >
            <IconPlus className="size-4" />
            <span className="text-xs">{uploading ? t.uploading : t.uploadImage}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onPickFile(file);
            }}
          />
        </div>
        <p className="text-xs text-text-dim">{t.imageHint}</p>
        {uploadError ? (
          <p role="alert" className="text-sm text-accent-secondary">
            {t.errors.upload}
          </p>
        ) : null}
        {imageMissing ? (
          <p role="alert" className="text-sm text-accent-secondary">
            {t.errors.image}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
            className="size-4 accent-[var(--color-accent)]"
          />
          {t.featured}
        </label>
        {product ? (
          <label className="flex items-center gap-2.5 text-sm text-text cursor-pointer">
            <input
              type="checkbox"
              name="archived"
              defaultChecked={product.archived}
              className="size-4 accent-[var(--color-accent)]"
            />
            {dict.admin.products.statusArchived}
          </label>
        ) : null}
      </div>

      <Button type="submit" variant="primary" className="self-start" data-testid="pf-save">
        {t.save}
      </Button>
    </form>
  );
}
