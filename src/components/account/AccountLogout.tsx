"use client";

import type { Locale } from "@/lib/i18n/config";

export function AccountLogout({ locale, label }: { locale: Locale; label: string }) {
  return (
    <button
      type="button"
      className="text-sm text-accent-secondary underline underline-offset-4 hover:opacity-80 cursor-pointer"
      onClick={async () => {
        await fetch("/api/account/logout", { method: "POST" });
        window.location.assign(`/${locale}`);
      }}
    >
      {label}
    </button>
  );
}
