import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireSection } from "@/lib/admin-guard";
import { getAnalyticsSummary } from "@/lib/analytics";
import { Price } from "@/components/ui/Price";

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "analytics");
  const dict = getDictionary(locale);
  const t = dict.admin.analytics;

  const s = await getAnalyticsSummary(30);
  const maxRevenue = Math.max(1, ...s.revenueSeries.map((p) => p.revenueBaisa));

  const statCard = (label: string, value: React.ReactNode) => (
    <div className="border border-surface-muted p-5">
      <p className="type-label text-text-dim">{label}</p>
      <p className="mt-2 font-heading text-2xl text-text tabular">{value}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-xl text-text">{t.title}</h2>
        <span className="text-sm text-text-dim">{t.rangeLabel}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCard(t.revenue, <Price baisa={s.totalRevenueBaisa} locale={locale} />)}
        {statCard(t.orders, s.totalOrders)}
        {statCard(t.avgOrder, <Price baisa={s.avgOrderValueBaisa} locale={locale} />)}
        {statCard(
          t.conversion,
          s.conversionRatePercent === null ? (
            <span className="text-base text-text-dim">{t.conversionUnavailable}</span>
          ) : (
            `${s.conversionRatePercent.toFixed(1)}%`
          ),
        )}
      </div>
      {s.conversionRatePercent !== null ? (
        <p className="-mt-6 text-xs text-text-dim">{t.conversionHint}</p>
      ) : null}

      {/* Revenue chart — plain CSS bars, no charting dependency */}
      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-lg text-text">{t.revenueChartTitle}</h3>
        <div
          className="flex items-end gap-[2px] border-b border-surface-muted pb-1"
          style={{ height: "8rem" }}
          data-testid="revenue-chart"
        >
          {s.revenueSeries.map((p) => (
            <div
              key={p.day}
              title={`${p.day}: ${(p.revenueBaisa / 1000).toFixed(3)} OMR`}
              className="flex-1 bg-accent-light/70 hover:bg-accent-light"
              style={{ height: `${Math.max(2, (p.revenueBaisa / maxRevenue) * 100)}%` }}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg text-text">{t.topProductsTitle}</h3>
          {s.topProducts.length === 0 ? (
            <p className="text-text-dim">{t.topProductsEmpty}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="hairline-b text-text-dim">
                  <th className="py-2 pe-4 text-start font-normal type-label">{t.colProduct}</th>
                  <th className="py-2 pe-4 text-start font-normal type-label">{t.colQuantity}</th>
                  <th className="py-2 text-start font-normal type-label">{t.colRevenue}</th>
                </tr>
              </thead>
              <tbody>
                {s.topProducts.map((p) => (
                  <tr key={p.productId} className="hairline-b">
                    <td className="py-2 pe-4">
                      <Link
                        href={`/${locale}/shop/${p.slug}`}
                        className="text-accent-light underline underline-offset-4"
                      >
                        {locale === "ar" ? p.nameAr : p.nameEn}
                      </Link>
                    </td>
                    <td className="py-2 pe-4 tabular">{p.quantitySold}</td>
                    <td className="py-2">
                      <Price baisa={p.revenueBaisa} locale={locale} className="text-text" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-heading text-lg text-text">{t.topCustomersTitle}</h3>
          {s.topCustomers.length === 0 ? (
            <p className="text-text-dim">{dict.admin.customers.empty}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="hairline-b text-text-dim">
                  <th className="py-2 pe-4 text-start font-normal type-label">
                    {dict.admin.customers.colName}
                  </th>
                  <th className="py-2 pe-4 text-start font-normal type-label">
                    {dict.admin.customers.colOrders}
                  </th>
                  <th className="py-2 text-start font-normal type-label">
                    {dict.admin.customers.colSpent}
                  </th>
                </tr>
              </thead>
              <tbody>
                {s.topCustomers.map((c) => (
                  <tr key={c.id} className="hairline-b">
                    <td className="py-2 pe-4">
                      <Link
                        href={`/${locale}/admin/customers/${c.id}`}
                        className="text-accent-light underline underline-offset-4"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2 pe-4 tabular">{c.orderCount}</td>
                    <td className="py-2">
                      <Price baisa={c.totalSpentBaisa} locale={locale} className="text-text" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-lg text-text">{t.lowStockTitle}</h3>
        {s.lowStockProducts.length === 0 ? (
          <p className="text-text-dim">{t.lowStockEmpty}</p>
        ) : (
          <ul className="flex flex-col hairline-t">
            {s.lowStockProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-2.5 hairline-b">
                <Link
                  href={`/${locale}/admin/products/${p.id}`}
                  className="text-accent-light underline underline-offset-4"
                >
                  {locale === "ar" ? p.nameAr : p.nameEn}
                </Link>
                <span
                  className={`tabular ${p.stock === 0 ? "text-accent-secondary" : "text-text-dim"}`}
                >
                  {t.colStock}: {p.stock}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
