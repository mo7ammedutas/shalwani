"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

/** Upload-then-save flow for lookbook images: the file goes to
 * /api/admin/upload first (Vercel Blob), then the returned URL plus
 * optional captions are submitted to the addGalleryImage action. */
export function GalleryUpload({
  dict,
  action,
}: {
  dict: Dictionary;
  action: (formData: FormData) => Promise<void>;
}) {
  const t = dict.admin.gallery;
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await res.json()) as { path?: string };
      if (res.ok && data.path) setUrl(data.path);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form action={action} className="flex max-w-md flex-col gap-5 border border-surface-muted p-5">
      <h3 className="font-heading text-lg text-text">{t.addTitle}</h3>
      <input type="hidden" name="url" value={url} />

      <div className="flex items-center gap-4">
        {url ? (
          <span className="relative block h-20 w-20 overflow-hidden border border-surface-muted bg-surface">
            <Image src={url} alt="" fill sizes="80px" className="object-cover" />
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="border border-dashed border-surface-muted px-4 py-2.5 text-sm text-text-dim hover:border-accent-light hover:text-accent-light disabled:opacity-50 cursor-pointer"
          data-testid="gallery-pick-file"
        >
          {uploading ? t.uploading : t.pickFile}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPick(file);
          }}
        />
      </div>
      <p className="text-xs text-text-dim">{t.sizeHint}</p>

      <div>
        <Label htmlFor="g-captionAr">{t.captionAr}</Label>
        <TextInput id="g-captionAr" name="captionAr" lang="ar" dir="rtl" maxLength={120} />
      </div>
      <div>
        <Label htmlFor="g-captionEn">{t.captionEn}</Label>
        <TextInput id="g-captionEn" name="captionEn" lang="en" dir="ltr" maxLength={120} />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={!url || uploading}
        className="self-start"
        data-testid="gallery-save"
      >
        {t.save}
      </Button>
    </form>
  );
}
