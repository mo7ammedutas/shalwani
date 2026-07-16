import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { productImagesClient } from "@/lib/product-images";
import { Price } from "@/components/ui/Price";
import { AccountLogout } from "@/components/account/AccountLogout";
import { ReorderButton, type ReorderLine } from "@/components/account/ReorderButton";
import { WishlistButton } from "@/components/shop/WishlistButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const dict = getDictionary(isLocale((await params).locale) ? ((await params).locale as Locale) : "ar");
  return { title: dict.account.dashboardTitle, robots: { index: false } };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/${locale}/account/login`);
  const dict = getDictionary(locale);
  const t = dict.account;

  const [orders, wishlist] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    }),
    prisma.wishlistItem.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { product: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 pt-10 pb-24 flex flex-col gap-14">
      <div className="flex flex-wrap items-center justify-between gap-4 hairline-b pb-6">
        <div>
          <h1 className="font-heading text-2xl font-light text-text">{t.dashboardTitle}</h1>
          <p className="text-sm text-text-dim">{customer.name} · {customer.phone}</p>
        </div>
        <AccountLogout locale={locale} label={t.logout} />
      </div>

      <section className="flex flex-col gap-6">
        <h2 className="font-heading text-xl text-text">{t.ordersTitle}</h2>
        {orders.length === 0 ? (
          <p className="text-text-dim">{t.ordersEmpty}</p>
        ) : (
          <ul className="flex flex-col hairline-t">
            {orders.map((order) => {
              const lines: ReorderLine[] = order.items.map((i) => ({
                slug: i.product.slug,
                nameAr: i.product.nameAr,
                nameEn: i.product.nameEn,
                priceBaisa: i.product.priceBaisa,
                image: productImagesClient(i.product.images)[0] ?? "",
                stock: i.product.stock,
                available: !i.product.archived,
                quantity: i.quantity,
              }));
              return (
                <li key={order.id} className="flex flex-col gap-3 py-6 hairline-b">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="tabular text-text" dir="ltr">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`type-label ${order.status === "paid" ? "text-accent-light" : "text-text-dim"}`}
                    >
                      {dict.admin.orders.statuses[order.status] ?? order.status}
                    </span>
                    <span className="tabular text-text-dim" dir="ltr">
                      {order.createdAt.toISOString().slice(0, 10)}
                    </span>
                    <Price baisa={order.totalBaisa} locale={locale} className="text-text" />
                  </div>
                  <p className="text-sm text-text-dim">
                    {order.items
                      .map((i) => `${locale === "ar" ? i.product.nameAr : i.product.nameEn} × ${i.quantity}`)
                      .join("، ")}
                  </p>
                  <ReorderButton lines={lines} dict={dict} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-heading text-xl text-text">{t.wishlistTitle}</h2>
        {wishlist.length === 0 ? (
          <p className="text-text-dim">{t.wishlistEmpty}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {wishlist.map((w) => {
              const name = locale === "ar" ? w.product.nameAr : w.product.nameEn;
              const image = productImagesClient(w.product.images)[0];
              return (
                <li key={w.id} className="flex flex-col gap-2.5">
                  <Link href={`/${locale}/shop/${w.product.slug}`} className="relative block aspect-square bg-surface">
                    <Image src={image} alt={name} fill sizes="25vw" className="object-cover" />
                  </Link>
                  <span className="text-sm text-text">{name}</span>
                  <Price baisa={w.product.priceBaisa} locale={locale} className="text-sm text-text-dim" />
                  <WishlistButton
                    productId={w.productId}
                    initialWishlisted
                    isLoggedIn
                    locale={locale}
                    addLabel={t.wishlistAdd}
                    removeLabel={t.wishlistRemove}
                    className="!px-3 !py-2 text-xs w-fit"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
