import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Price } from "@/components/ui/Price";
import { PrintButton } from "@/components/admin/PrintButton";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { deleteOrder } from "@/app/[locale]/admin/actions";

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ deleted?: string }>;
}) {
  const [{ locale: raw }, notice] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const t = dict.admin.orders;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, items: { include: { product: true } }, giftAddons: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl text-text">{t.title}</h2>
        {orders.length > 0 ? <PrintButton label={t.printAll} /> : null}
      </div>
      {notice.deleted ? (
        <p
          role="status"
          data-testid="admin-notice"
          className="print:hidden border border-accent-light bg-surface px-4 py-3 text-sm text-accent-light"
        >
          {t.deleted}
        </p>
      ) : null}
      {orders.length === 0 ? (
        <p className="py-14 text-center text-text-dim">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="hairline-b text-text-dim">
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colNumber}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colCustomer}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colPhone}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colItems}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colTotal}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colStatus}</th>
                <th className="py-3 text-start font-normal type-label">{t.colDate}</th>
                <th className="print:hidden py-3 text-start font-normal type-label"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="hairline-b align-top">
                  <td className="py-3 pe-4 tabular" dir="ltr">
                    {o.orderNumber}
                  </td>
                  <td className="py-3 pe-4 text-text">{o.customer.name}</td>
                  <td className="py-3 pe-4 tabular" dir="ltr">
                    {o.customer.phone}
                  </td>
                  <td className="py-3 pe-4 text-text-dim">
                    <span className="block">
                      {o.items
                        .map(
                          (i) =>
                            `${locale === "ar" ? i.product.nameAr : i.product.nameEn} × ${i.quantity}`,
                        )
                        .join("، ")}
                    </span>
                    {o.isGift ? (
                      <span className="mt-1.5 flex flex-col gap-1 border-s-2 border-accent-light ps-2.5">
                        <span className="type-label text-accent-light">{t.giftBadge}</span>
                        {o.giftAddons.length > 0 ? (
                          <span className="text-xs">
                            {o.giftAddons
                              .map((g) => (locale === "ar" ? g.nameAr : g.nameEn))
                              .join("، ")}
                          </span>
                        ) : null}
                        {o.recipientName ? (
                          <span className="text-xs">
                            {t.recipientLabel}: {o.recipientName}
                          </span>
                        ) : null}
                        {o.giftMessage ? (
                          <span className="text-xs italic">
                            {t.giftMessageLabel}: {o.giftMessage}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                    {o.shippingZone === "gulf" ? (
                      <span className="mt-1 block text-xs text-accent-secondary">
                        {t.shippingGulf}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pe-4">
                    <Price baisa={o.totalBaisa} locale={locale} className="text-text" />
                  </td>
                  <td className="py-3 pe-4">
                    <span
                      className={`type-label ${
                        o.status === "paid"
                          ? "text-accent-light"
                          : o.status === "pending"
                            ? "text-surface-cream"
                            : "text-accent-secondary"
                      }`}
                    >
                      {t.statuses[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="py-3 text-text-dim tabular" dir="ltr">
                    {o.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="print:hidden py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/${locale}/admin/orders/${o.id}/print`}
                        className="text-sm text-accent-light underline underline-offset-4"
                        data-testid={`print-${o.orderNumber}`}
                      >
                        {t.print}
                      </Link>
                      <DeleteProductButton
                        action={deleteOrder.bind(null, locale, o.id)}
                        label={t.delete}
                        confirmText={t.confirmDelete}
                        testId={`delete-${o.orderNumber}`}
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
