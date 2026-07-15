import Link from "next/link";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin-auth";
import { AdminLogout } from "@/components/admin/AdminLogout";

export const metadata = { robots: { index: false } };

export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  if (!(await isAdmin())) redirect(`/${locale}/admin/login`);
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 md:px-8 pt-8 pb-24 flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 hairline-b pb-5">
        <h1 className="font-heading text-2xl font-light text-text">{dict.admin.title}</h1>
        <nav className="flex items-center gap-6">
          <Link href={`/${locale}/admin`} className="type-label text-text hover:text-accent-light">
            {dict.admin.navProducts}
          </Link>
          <Link
            href={`/${locale}/admin/orders`}
            className="type-label text-text hover:text-accent-light"
          >
            {dict.admin.navOrders}
          </Link>
          <Link href={`/${locale}`} className="type-label text-text-dim hover:text-accent-light">
            {dict.admin.backToStore}
          </Link>
          <AdminLogout locale={locale} label={dict.admin.logout} />
        </nav>
      </div>
      {children}
    </div>
  );
}
