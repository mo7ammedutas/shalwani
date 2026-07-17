import Link from "next/link";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { canView, SECTION_PATH, type Section } from "@/lib/roles";
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
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  const dict = getDictionary(locale);
  const t = dict.admin;

  const allNavItems: { section: Section; label: string }[] = [
    { section: "products" as Section, label: t.navProducts },
    { section: "giftAddons" as Section, label: t.navGiftAddons },
    { section: "orders" as Section, label: t.navOrders },
    { section: "customers" as Section, label: t.navCustomers },
    { section: "coupons" as Section, label: t.navCoupons },
    { section: "reviews" as Section, label: t.navReviews },
    { section: "analytics" as Section, label: t.navAnalytics },
    { section: "staff" as Section, label: t.navStaff },
    { section: "settings" as Section, label: t.navSettings },
  ];
  const navItems = allNavItems.filter((item) => canView(admin.role, item.section));

  return (
    <div className="mx-auto w-full max-w-6xl px-5 md:px-8 pt-8 pb-24 flex flex-col gap-8">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 hairline-b pb-5">
        <div>
          <h1 className="font-heading text-2xl font-light text-text">{t.title}</h1>
          <p className="text-xs text-text-dim">
            {admin.name} · {t.staff.roles[admin.role] ?? admin.role}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.section}
              href={`/${locale}/admin/${SECTION_PATH[item.section]}`}
              className="type-label text-text hover:text-accent-light"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`/${locale}/admin/security`}
            className="type-label text-text-dim hover:text-accent-light"
          >
            {t.navSecurity}
          </Link>
          <Link href={`/${locale}`} className="type-label text-text-dim hover:text-accent-light">
            {t.backToStore}
          </Link>
          <AdminLogout locale={locale} label={t.logout} />
        </nav>
      </div>
      {children}
    </div>
  );
}
