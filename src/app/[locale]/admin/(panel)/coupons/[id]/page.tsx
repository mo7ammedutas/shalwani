import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { updateCoupon } from "@/app/[locale]/admin/actions";
import { CouponForm } from "@/components/admin/CouponForm";
import { requireSection } from "@/lib/admin-guard";

export default async function AdminEditCouponPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw, id }, { error }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "coupons");
  const dict = getDictionary(locale);

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/${locale}/admin/coupons`}
        className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light w-fit"
      >
        {dict.admin.coupons.title}
      </Link>
      <h2 className="font-heading text-xl text-text">{dict.admin.coupons.form.editTitle}</h2>
      <CouponForm dict={dict} action={updateCoupon.bind(null, locale, coupon.id)} coupon={coupon} error={error} />
    </div>
  );
}
