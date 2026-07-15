import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { Price } from "@/components/ui/Price";
import { ButtonLink } from "@/components/ui/Button";
import { deleteGiftAddon, setGiftAddonActive } from "@/app/[locale]/admin/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export default async function AdminGiftAddonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string; deactivated?: string }>;
}) {
  const [{ locale: raw }, notice] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const t = dict.admin.giftAddons;

  const addons = await prisma.giftAddon.findMany({ orderBy: { createdAt: "desc" } });

  const noticeText = notice.deactivated
    ? t.deactivatedInstead
    : notice.deleted
      ? t.deleted
      : notice.saved
        ? t.saved
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl text-text">{t.title}</h2>
        <ButtonLink href={`/${locale}/admin/gift-addons/new`} variant="primary" data-testid="new-gift-addon">
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

      {addons.length === 0 ? (
        <p className="py-14 text-center text-text-dim">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm" data-testid="gift-addons-table">
            <thead>
              <tr className="hairline-b text-text-dim">
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colName}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colPrice}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colStatus}</th>
                <th className="py-3 text-start font-normal type-label"></th>
              </tr>
            </thead>
            <tbody>
              {addons.map((a) => (
                <tr key={a.id} className="hairline-b align-middle" data-testid={`row-${a.slug}`}>
                  <td className="py-3 pe-4">
                    <span className="block text-text">
                      {locale === "ar" ? a.nameAr : a.nameEn}
                    </span>
                    <span lang="en" dir="ltr" className="block text-xs text-text-dim">
                      {a.slug}
                    </span>
                  </td>
                  <td className="py-3 pe-4">
                    <Price baisa={a.priceBaisa} locale={locale} className="text-text" />
                  </td>
                  <td className="py-3 pe-4">
                    <span
                      className={`type-label ${a.active ? "text-accent-light" : "text-accent-secondary"}`}
                    >
                      {a.active ? t.statusActive : t.statusInactive}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-4">
                      <form action={setGiftAddonActive.bind(null, locale, a.id, !a.active)}>
                        <button
                          type="submit"
                          className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light cursor-pointer"
                        >
                          {a.active ? t.deactivate : t.activate}
                        </button>
                      </form>
                      <Link
                        href={`/${locale}/admin/gift-addons/${a.id}`}
                        className="text-sm text-accent-light underline underline-offset-4"
                        data-testid={`edit-${a.slug}`}
                      >
                        {t.edit}
                      </Link>
                      <DeleteProductButton
                        action={deleteGiftAddon.bind(null, locale, a.id)}
                        label={t.delete}
                        confirmText={t.confirmDelete}
                        testId={`delete-${a.slug}`}
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
