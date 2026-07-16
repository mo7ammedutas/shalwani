import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Price } from "@/components/ui/Price";
import { PrintButton } from "@/components/admin/PrintButton";
import { BrandSeal } from "@/components/ui/icons";
import { requireSection } from "@/lib/admin-guard";

/** Print-friendly invoice for a single order; opens the print dialog on load. */
export default async function OrderPrintPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "orders");
  const dict = getDictionary(locale);
  const t = dict.admin.orders;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } }, giftAddons: true },
  });
  if (!order) notFound();

  const itemsSubtotal = order.items.reduce((s, i) => s + i.unitPriceBaisa * i.quantity, 0);

  const row = "flex items-center justify-between gap-6 py-2";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8" data-testid="order-invoice">
      <div className="print:hidden flex items-center justify-between gap-4">
        <Link
          href={`/${locale}/admin/orders`}
          className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light"
        >
          {t.backToOrders}
        </Link>
        <PrintButton label={t.print} autoPrint />
      </div>

      {/* Invoice head */}
      <header className="flex items-start justify-between gap-6 hairline-b pb-6">
        <div className="flex items-center gap-3">
          <BrandSeal className="size-7 text-accent" />
          <span className="flex flex-col leading-tight">
            <span lang="ar" className="font-display text-2xl font-bold text-text">
              شالواني
            </span>
            <span lang="en" className="text-[0.6rem] tracking-[0.4em] uppercase text-text-dim">
              Shalwani
            </span>
          </span>
        </div>
        <div className="text-end">
          <p className="type-label text-text-dim">{t.invoiceTitle}</p>
          <p className="font-heading text-xl text-text tabular" dir="ltr">
            {order.orderNumber}
          </p>
          <p className="text-sm text-text-dim tabular" dir="ltr">
            {order.createdAt.toISOString().slice(0, 16).replace("T", " ")}
          </p>
        </div>
      </header>

      {/* Customer */}
      <section className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div>
          <p className="text-text-dim">{t.colCustomer}</p>
          <p className="text-text">{order.customer.name}</p>
        </div>
        <div>
          <p className="text-text-dim">{t.colPhone}</p>
          <p className="text-text tabular" dir="ltr">
            {order.customer.phone}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-text-dim">{t.addressLabel}</p>
          <p className="text-text">
            {order.shippingAddress}
            {order.shippingZone === "gulf" ? ` — ${t.shippingGulf}` : ""}
          </p>
        </div>
        {order.notes ? (
          <div className="col-span-2">
            <p className="text-text-dim">{t.notesLabel}</p>
            <p className="text-text">{order.notes}</p>
          </div>
        ) : null}
      </section>

      {/* Gift block */}
      {order.isGift ? (
        <section className="border border-surface-muted p-4 text-sm flex flex-col gap-1.5">
          <p className="type-label text-accent-light">{t.giftBadge}</p>
          {order.recipientName ? (
            <p className="text-text">
              {t.recipientLabel}: {order.recipientName}
            </p>
          ) : null}
          {order.giftMessage ? (
            <p className="text-text italic">«{order.giftMessage}»</p>
          ) : null}
        </section>
      ) : null}

      {/* Items */}
      <section className="flex flex-col text-sm">
        {order.items.map((i) => (
          <div key={i.id} className={`${row} hairline-b`}>
            <span className="text-text">
              {locale === "ar" ? i.product.nameAr : i.product.nameEn}
              <span className="text-text-dim"> × {i.quantity}</span>
            </span>
            <Price baisa={i.unitPriceBaisa * i.quantity} locale={locale} className="text-text" />
          </div>
        ))}
        {order.giftAddons.map((g) => (
          <div key={g.id} className={`${row} hairline-b`}>
            <span className="text-text-dim">
              {t.addonsLabel}: {locale === "ar" ? g.nameAr : g.nameEn}
            </span>
            <Price baisa={g.priceBaisa} locale={locale} className="text-text" />
          </div>
        ))}

        <div className={`${row} pt-4`}>
          <span className="text-text-dim">{t.itemsSubtotal}</span>
          <Price baisa={itemsSubtotal} locale={locale} className="text-text" />
        </div>
        {order.shippingFeeBaisa > 0 ? (
          <div className={row}>
            <span className="text-text-dim">{t.shippingFeeLabel}</span>
            <Price baisa={order.shippingFeeBaisa} locale={locale} className="text-text" />
          </div>
        ) : null}
        {order.vatBaisa > 0 ? (
          <div className={row}>
            <span className="text-text-dim">{dict.checkout.vatLabel}</span>
            <Price baisa={order.vatBaisa} locale={locale} className="text-text" />
          </div>
        ) : null}
        <div className={`${row} hairline-t mt-2 pt-4`}>
          <span className="text-text">{t.grandTotal}</span>
          <Price
            baisa={order.totalBaisa}
            locale={locale}
            className="font-heading text-xl text-text"
          />
        </div>
        <p className="pt-2 text-xs text-text-dim">
          {t.colStatus}: {t.statuses[order.status] ?? order.status}
        </p>
      </section>
    </div>
  );
}
