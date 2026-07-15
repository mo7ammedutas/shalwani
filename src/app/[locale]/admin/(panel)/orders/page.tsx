import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Price } from "@/components/ui/Price";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const t = dict.admin.orders;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: true, items: { include: { product: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl text-text">{t.title}</h2>
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
                    {o.items
                      .map(
                        (i) =>
                          `${locale === "ar" ? i.product.nameAr : i.product.nameEn} × ${i.quantity}`,
                      )
                      .join("، ")}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
