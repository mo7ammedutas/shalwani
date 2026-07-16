"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { IconHeart } from "@/components/ui/icons";

export function WishlistButton({
  productId,
  initialWishlisted,
  isLoggedIn,
  locale,
  addLabel,
  removeLabel,
  className = "",
}: {
  productId: string;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
  locale: Locale;
  addLabel: string;
  removeLabel: string;
  className?: string;
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!isLoggedIn) {
      window.location.assign(`/${locale}/account/login`);
      return;
    }
    setBusy(true);
    const next = !wishlisted;
    setWishlisted(next); // optimistic
    try {
      const res = await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) setWishlisted(!next); // revert on failure
    } catch {
      setWishlisted(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? removeLabel : addLabel}
      data-testid="wishlist-toggle"
      className={`inline-flex items-center justify-center gap-2 border border-surface-muted px-5 py-3 text-base text-text hover:border-accent-light cursor-pointer disabled:opacity-60 ${className}`}
    >
      <IconHeart filled={wishlisted} className={wishlisted ? "text-accent-secondary" : ""} />
      {wishlisted ? removeLabel : addLabel}
    </button>
  );
}
