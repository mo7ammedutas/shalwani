"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Rendered by the order-success page once payment is confirmed.
 * Waits for cart hydration — the provider's localStorage read runs after
 * child effects, and clearing before it would be silently undone. */
export function ClearCartOnMount() {
  const { clear, hydrated } = useCart();
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);
  return null;
}
