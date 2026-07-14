"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { fill } from "@/lib/i18n";
import { IconClose } from "@/components/ui/icons";

export interface GalleryLabels {
  zoom: string;
  closeZoom: string;
  imageOf: string;
}

export function ProductGallery({
  images,
  name,
  labels,
}: {
  images: string[];
  name: string;
  labels: GalleryLabels;
}) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  const alt = (i: number) => `${name} — ${fill(labels.imageOf, { index: i + 1, total: images.length })}`;

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setLightbox(true)}
        aria-label={labels.zoom}
        className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-soft)] border border-surface-muted cursor-zoom-in"
      >
        <Image
          src={images[current]}
          alt={alt(current)}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-[var(--duration-stately)] ease-[var(--ease-luxe)] group-hover:scale-[1.02]"
        />
      </button>

      {images.length > 1 ? (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={alt(i)}
              aria-current={i === current}
              className={`relative aspect-[4/5] w-20 overflow-hidden rounded-[var(--radius-soft)] border cursor-pointer ${
                i === current ? "border-accent" : "border-surface-muted hover:border-accent-dark"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] p-4 md:p-10"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label={labels.closeZoom}
            onClick={() => setLightbox(false)}
            className="absolute top-5 end-5 z-10 p-3 text-text hover:text-accent-light cursor-pointer"
          >
            <IconClose className="size-6" />
          </button>
          <div
            className="relative h-full max-h-[85svh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[current]}
              alt={alt(current)}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
