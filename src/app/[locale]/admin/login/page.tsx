import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { isAdmin } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  if (await isAdmin()) redirect(`/${locale}/admin`);
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 px-5 pt-20 pb-28">
      <h1 className="font-heading text-3xl font-light text-text text-center">
        {dict.admin.loginTitle}
      </h1>
      <AdminLoginForm locale={locale} dict={dict} />
    </div>
  );
}
