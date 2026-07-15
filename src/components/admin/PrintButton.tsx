"use client";

import { useEffect } from "react";

/** Opens the browser print dialog; with autoPrint it fires once on mount
 * (used by the single-order invoice page). */
export function PrintButton({
  label,
  autoPrint = false,
}: {
  label: string;
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [autoPrint]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      data-testid="print-button"
      className="print:hidden inline-flex items-center justify-center gap-2.5 px-7 py-3 font-body text-base tracking-wide bg-accent text-text-on-accent hover:bg-accent-light cursor-pointer"
    >
      {label}
    </button>
  );
}
