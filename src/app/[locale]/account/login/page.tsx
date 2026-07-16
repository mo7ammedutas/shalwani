import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { LoginForm } from "@/components/account/LoginForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const dict = getDictionary(isLocale((await params).locale) ? (await params).locale as Locale : "ar");
  return { title: dict.account.loginTitle, robots: { index: false } };
}

export default async function AccountLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  if (await getCurrentCustomer()) redirect(`/${locale}/account`);
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 px-5 pt-16 pb-28">
      <h1 className="font-heading text-3xl font-light text-text text-center">
        {dict.account.loginTitle}
      </h1>
      <LoginForm locale={locale} dict={dict} />
    </div>
  );
}
