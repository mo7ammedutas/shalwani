import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getCustomersWithStats } from "@/lib/crm";
import { Price } from "@/components/ui/Price";
import { requireSection } from "@/lib/admin-guard";
import { deleteCustomer } from "@/app/[locale]/admin/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export default async function AdminCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ deleted?: string }>;
}) {
  const [{ locale: raw }, notice] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "customers");
  const dict = getDictionary(locale);
  const t = dict.admin.customers;

  const customers = await getCustomersWithStats();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl text-text">{t.title}</h2>
      {notice.deleted ? (
        <p
          role="status"
          data-testid="admin-notice"
          className="border border-accent-light bg-surface px-4 py-3 text-sm text-accent-light"
        >
          {t.deleted}
        </p>
      ) : null}
      {customers.length === 0 ? (
        <p className="py-14 text-center text-text-dim">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="customers-table">
            <thead>
              <tr className="hairline-b text-text-dim">
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colName}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colPhone}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colOrders}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colSpent}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colLastOrder}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colStatus}</th>
                <th className="py-3 text-start font-normal type-label"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="hairline-b" data-testid={`customer-row-${c.phone}`}>
                  <td className="py-3 pe-4">
                    <Link
                      href={`/${locale}/admin/customers/${c.id}`}
                      className="text-accent-light underline underline-offset-4"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-3 pe-4 tabular" dir="ltr">
                    {c.phone}
                  </td>
                  <td className="py-3 pe-4 tabular">{c.orderCount}</td>
                  <td className="py-3 pe-4">
                    <Price baisa={c.totalSpentBaisa} locale={locale} className="text-text" />
                  </td>
                  <td className="py-3 pe-4 tabular text-text-dim" dir="ltr">
                    {c.lastOrderAt ? c.lastOrderAt.toISOString().slice(0, 10) : t.never}
                  </td>
                  <td className="py-3 pe-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {c.vip ? (
                        <span className="type-label bg-surface-muted px-2 py-0.5 text-accent-light">
                          {t.vip}
                        </span>
                      ) : null}
                      <span className="text-xs text-text-dim">
                        {c.hasAccount ? t.hasAccount : t.guestOnly}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end">
                      <DeleteProductButton
                        action={deleteCustomer.bind(null, locale, c.id)}
                        label={t.delete}
                        confirmText={t.confirmDelete}
                        testId={`delete-customer-${c.phone}`}
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
