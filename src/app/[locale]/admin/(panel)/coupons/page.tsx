import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Price } from "@/components/ui/Price";
import { ButtonLink } from "@/components/ui/Button";
import { deleteCoupon, setCouponActive } from "@/app/[locale]/admin/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { requireSection } from "@/lib/admin-guard";

export default async function AdminCouponsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const [{ locale: raw }, notice] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "coupons");
  const dict = getDictionary(locale);
  const t = dict.admin.coupons;

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  const noticeText = notice.deleted ? t.deleted : notice.saved ? t.saved : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl text-text">{t.title}</h2>
        <ButtonLink href={`/${locale}/admin/coupons/new`} variant="primary" data-testid="new-coupon">
          {t.new}
        </ButtonLink>
      </div>

      {noticeText ? (
        <p
          role="status"
          data-testid="admin-notice"
          className="border border-accent-light bg-surface px-4 py-3 text-sm text-accent-light"
        >
          {noticeText}
        </p>
      ) : null}

      {coupons.length === 0 ? (
        <p className="py-14 text-center text-text-dim">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="coupons-table">
            <thead>
              <tr className="hairline-b text-text-dim">
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colCode}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colKind}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colValue}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colUsage}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colExpiry}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colStatus}</th>
                <th className="py-3 text-start font-normal type-label"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="hairline-b align-middle" data-testid={`coupon-row-${c.code}`}>
                  <td className="py-3 pe-4 tabular" dir="ltr">
                    <span className="text-text">{c.code}</span>
                  </td>
                  <td className="py-3 pe-4 text-text-dim">{t.kinds[c.kind] ?? c.kind}</td>
                  <td className="py-3 pe-4">
                    {c.kind === "percent" ? (
                      <span className="text-text tabular" dir="ltr">
                        {c.value}%
                      </span>
                    ) : c.kind === "fixed" ? (
                      <Price baisa={c.value} locale={locale} className="text-text" />
                    ) : (
                      <span className="text-text-dim">—</span>
                    )}
                  </td>
                  <td className="py-3 pe-4 tabular text-text-dim" dir="ltr">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ` · ${t.unlimited}`}
                  </td>
                  <td className="py-3 pe-4 tabular text-text-dim" dir="ltr">
                    {c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : t.noExpiry}
                  </td>
                  <td className="py-3 pe-4">
                    <span
                      className={`type-label ${c.active ? "text-accent-light" : "text-accent-secondary"}`}
                    >
                      {c.active ? t.statusActive : t.statusInactive}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-4">
                      <form action={setCouponActive.bind(null, locale, c.id, !c.active)}>
                        <button
                          type="submit"
                          className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light cursor-pointer"
                        >
                          {c.active ? t.deactivate : t.activate}
                        </button>
                      </form>
                      <Link
                        href={`/${locale}/admin/coupons/${c.id}`}
                        className="text-sm text-accent-light underline underline-offset-4"
                        data-testid={`edit-coupon-${c.code}`}
                      >
                        {t.edit}
                      </Link>
                      <DeleteProductButton
                        action={deleteCoupon.bind(null, locale, c.id)}
                        label={t.delete}
                        confirmText={t.confirmDelete}
                        testId={`delete-coupon-${c.code}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
