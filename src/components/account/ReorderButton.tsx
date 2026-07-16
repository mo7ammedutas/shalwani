"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Dictionary } from "@/lib/i18n";

export interface ReorderLine {
  slug: string;
  nameAr: string;
  nameEn: string;
  priceBaisa: number;
  image: string;
  stock: number;
  available: boolean;
  quantity: number;
}

export function ReorderButton({ lines, dict }: { lines: ReorderLine[]; dict: Dictionary }) {
  const { addItem, openCart } = useCart();
  const [state, setState] = useState<"idle" | "done" | "partial">("idle");
  const t = dict.account;

  function onReorder() {
    let allAvailable = true;
    for (const line of lines) {
      if (!line.available || line.stock <= 0) {
        allAvailable = false;
        continue;
      }
      addItem(
        {
          slug: line.slug,
          nameAr: line.nameAr,
          nameEn: line.nameEn,
          priceBaisa: line.priceBaisa,
          image: line.image,
          stock: line.stock,
        },
        Math.min(line.quantity, line.stock),
      );
    }
    setState(allAvailable ? "done" : "partial");
    openCart();
  }

  return (
    <div className="flex flex-col gap-1.5 items-start">
      <button
        type="button"
        onClick={onReorder}
        data-testid="reorder-button"
        className="text-sm text-accent-light underline underline-offset-4 hover:opacity-80 cursor-pointer"
      >
        {t.reorder}
      </button>
      {state === "done" ? <p className="text-xs text-accent-light">{t.reorderNotice}</p> : null}
      {state === "partial" ? <p className="text-xs text-accent-secondary">{t.reorderUnavailable}</p> : null}
    </div>
  );
}
