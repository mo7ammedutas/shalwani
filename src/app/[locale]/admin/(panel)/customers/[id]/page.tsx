import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getCustomerDetail } from "@/lib/crm";
import { updateCustomerNotes } from "@/app/[locale]/admin/actions";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { requireSection } from "@/lib/admin-guard";

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ locale: raw, id }, { saved }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "customers");
  const dict = getDictionary(locale);
  const t = dict.admin.customers;

  const detail = await getCustomerDetail(id);
  if (!detail) notFound();
  const { customer, totalSpentBaisa, orderCount, vip } = detail;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/${locale}/admin/customers`}
        className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light w-fit"
      >
        {t.back}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="font-heading text-xl text-text">{customer.name}</h2>
          <p className="tabular text-text-dim" dir="ltr">
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ""}
          </p>
          {vip ? (
            <span className="type-label mt-2 inline-block bg-surface-muted px-2 py-0.5 text-accent-light">
              {t.vip}
            </span>
          ) : null}
        </div>
        <div className="flex gap-8 text-end">
          <div>
            <p className="type-label text-text-dim">{t.colOrders}</p>
            <p className="font-heading text-xl text-text tabular">{orderCount}</p>
          </div>
          <div>
            <p className="type-label text-text-dim">{t.colSpent}</p>
            <Price baisa={totalSpentBaisa} locale={locale} className="font-heading text-xl text-text" />
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-4 border border-surface-muted p-5">
        <h3 className="font-heading text-lg text-text">{t.notesTitle}</h3>
        <p className="text-xs text-text-dim">{t.notesHint}</p>
        <form action={updateCustomerNotes.bind(null, locale, customer.id)} className="flex flex-col gap-3">
          <TextArea
            name="notes"
            rows={4}
            defaultValue={customer.notes ?? ""}
            placeholder={t.notesPlaceholder}
            data-testid="customer-notes"
          />
          <Button type="submit" variant="quiet" className="self-start" data-testid="save-notes">
            {t.saveNotes}
          </Button>
          {saved ? <p className="text-sm text-accent-light">{t.notesSaved}</p> : null}
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-lg text-text">{t.ordersTitle}</h3>
        {customer.orders.length === 0 ? (
          <p className="text-text-dim">{t.empty}</p>
        ) : (
          <ul className="flex flex-col hairline-t">
            {customer.orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4 hairline-b">
                <span className="tabular text-text" dir="ltr">
                  {order.orderNumber}
                </span>
                <span className="text-sm text-text-dim">
                  {order.items
                    .map((i) => `${locale === "ar" ? i.product.nameAr : i.product.nameEn} × ${i.quantity}`)
                    .join("، ")}
                </span>
                <span
                  className={`type-label ${order.status === "paid" ? "text-accent-light" : "text-text-dim"}`}
                >
                  {dict.admin.orders.statuses[order.status] ?? order.status}
                </span>
                <Price baisa={order.totalBaisa} locale={locale} className="text-text" />
                <span className="tabular text-text-dim" dir="ltr">
                  {order.createdAt.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
