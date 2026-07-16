import Image from "next/image";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { requireSection } from "@/lib/admin-guard";
import { productImagesClient } from "@/lib/product-images";
import { Price } from "@/components/ui/Price";
import { ButtonLink } from "@/components/ui/Button";
import { deleteProduct, setArchived } from "@/app/[locale]/admin/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string; archived?: string }>;
}) {
  const [{ locale: raw }, notice] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "products");
  const dict = getDictionary(locale);
  const t = dict.admin.products;

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  const noticeText = notice.archived
    ? t.archivedInstead
    : notice.deleted
      ? t.deleted
      : notice.saved
        ? t.saved
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl text-text">{t.title}</h2>
        <ButtonLink href={`/${locale}/admin/products/new`} variant="primary" data-testid="new-product">
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

      {products.length === 0 ? (
        <p className="py-14 text-center text-text-dim">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm" data-testid="products-table">
            <thead>
              <tr className="hairline-b text-text-dim">
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colImage}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colName}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colPrice}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colStock}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colStatus}</th>
                <th className="py-3 text-start font-normal type-label"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const image = productImagesClient(p.images)[0];
                const name = locale === "ar" ? p.nameAr : p.nameEn;
                return (
                  <tr key={p.id} className="hairline-b align-middle" data-testid={`row-${p.slug}`}>
                    <td className="py-3 pe-4">
                      <span className="relative block h-14 w-14 overflow-hidden bg-surface">
                        {image ? (
                          <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                        ) : null}
                      </span>
                    </td>
                    <td className="py-3 pe-4">
                      <span className="block text-text">{name}</span>
                      <span lang="en" dir="ltr" className="block text-xs text-text-dim">
                        {p.slug}
                      </span>
                    </td>
                    <td className="py-3 pe-4">
                      <Price baisa={p.priceBaisa} locale={locale} className="text-text" />
                    </td>
                    <td className="py-3 pe-4 tabular">{p.stock}</td>
                    <td className="py-3 pe-4">
                      <span
                        className={`type-label ${p.archived ? "text-accent-secondary" : "text-accent-light"}`}
                      >
                        {p.archived ? t.statusArchived : t.statusLive}
                        {p.featured && !p.archived ? ` · ${t.statusFeatured}` : ""}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-4">
                        <form action={setArchived.bind(null, locale, p.id, !p.archived)}>
                          <button
                            type="submit"
                            className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light cursor-pointer"
                          >
                            {p.archived ? t.unarchive : t.archive}
                          </button>
                        </form>
                        <Link
                          href={`/${locale}/admin/products/${p.id}`}
                          className="text-sm text-accent-light underline underline-offset-4"
                          data-testid={`edit-${p.slug}`}
                        >
                          {t.edit}
                        </Link>
                        <DeleteProductButton
                          action={deleteProduct.bind(null, locale, p.id)}
                          label={t.delete}
                          confirmText={t.confirmDelete}
                          testId={`delete-${p.slug}`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
