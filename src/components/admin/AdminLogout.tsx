"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

export function AdminLogout({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="type-label text-accent-secondary hover:opacity-80 cursor-pointer"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace(`/${locale}/admin/login`);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
