import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { createCoupon } from "@/app/[locale]/admin/actions";
import { CouponForm } from "@/components/admin/CouponForm";
import { requireSection } from "@/lib/admin-guard";

export default async function AdminNewCouponPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw }, { error }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "coupons");
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/${locale}/admin/coupons`}
        className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light w-fit"
      >
        {dict.admin.coupons.title}
      </Link>
      <h2 className="font-heading text-xl text-text">{dict.admin.coupons.form.createTitle}</h2>
      <CouponForm dict={dict} action={createCoupon.bind(null, locale)} error={error} />
    </div>
  );
}
