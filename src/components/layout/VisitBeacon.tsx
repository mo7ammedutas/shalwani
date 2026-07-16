"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Fires once per page load on storefront routes only (never /admin), so
 * the analytics conversion metric isn't skewed by the merchant's own use
 * of the dashboard. Fire-and-forget — never blocks or throws. */
export function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes("/admin")) return;
    fetch("/api/analytics/pageview", { method: "POST" }).catch(() => {});
  }, [pathname]);

  return null;
}
