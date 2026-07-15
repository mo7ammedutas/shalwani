"use client";

import type { Locale } from "@/lib/i18n/config";

export function AdminLogout({ locale, label }: { locale: Locale; label: string }) {
  return (
    <button
      type="button"
      className="type-label text-accent-secondary hover:opacity-80 cursor-pointer"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.assign(`/${locale}/admin/login`);
      }}
    >
      {label}
    </button>
  );
}
