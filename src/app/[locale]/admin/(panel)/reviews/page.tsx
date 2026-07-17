import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { deleteReview, setReviewApproved } from "@/app/[locale]/admin/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { requireSection } from "@/lib/admin-guard";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-accent-light tabular" dir="ltr" aria-label={`${rating}/5`}>
      {"★".repeat(rating)}
      <span className="text-surface-muted">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const [{ locale: raw }, notice] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "reviews");
  const dict = getDictionary(locale);
  const t = dict.admin.reviews;

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { nameAr: true, nameEn: true, slug: true } },
      customer: { select: { name: true, phone: true } },
    },
  });
  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  const noticeText = notice.deleted ? t.deleted : notice.saved ? t.saved : null;

  const renderRows = (rows: typeof reviews) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="hairline-b text-text-dim">
            <th className="py-3 pe-4 text-start font-normal type-label">{t.colProduct}</th>
            <th className="py-3 pe-4 text-start font-normal type-label">{t.colCustomer}</th>
            <th className="py-3 pe-4 text-start font-normal type-label">{t.colRating}</th>
            <th className="py-3 pe-4 text-start font-normal type-label">{t.colText}</th>
            <th className="py-3 pe-4 text-start font-normal type-label">{t.colDate}</th>
            <th className="py-3 text-start font-normal type-label"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hairline-b align-top" data-testid={`review-row-${r.id}`}>
              <td className="py-3 pe-4 text-text">
                {locale === "ar" ? r.product.nameAr : r.product.nameEn}
              </td>
              <td className="py-3 pe-4">
                <span className="block text-text">{r.customer.name}</span>
                <span className="block text-xs text-text-dim tabular" dir="ltr">
                  {r.customer.phone}
                </span>
              </td>
              <td className="py-3 pe-4">
                <Stars rating={r.rating} />
              </td>
              <td className="py-3 pe-4 max-w-md text-text-dim">{r.text}</td>
              <td className="py-3 pe-4 tabular text-text-dim" dir="ltr">
                {r.createdAt.toISOString().slice(0, 10)}
              </td>
              <td className="py-3">
                <div className="flex items-center justify-end gap-4">
                  <form action={setReviewApproved.bind(null, locale, r.id, !r.approved)}>
                    <button
                      type="submit"
                      className="text-sm text-accent-light underline underline-offset-4 cursor-pointer"
                      data-testid={`toggle-review-${r.id}`}
                    >
                      {r.approved ? t.unapprove : t.approve}
                    </button>
                  </form>
                  <DeleteProductButton
                    action={deleteReview.bind(null, locale, r.id)}
                    label={t.delete}
                    confirmText={t.confirmDelete}
                    testId={`delete-review-${r.id}`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading text-xl text-text">{t.title}</h2>

      {noticeText ? (
        <p
          role="status"
          data-testid="admin-notice"
          className="border border-accent-light bg-surface px-4 py-3 text-sm text-accent-light"
        >
          {noticeText}
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <p className="py-14 text-center text-text-dim">{t.empty}</p>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h3 className="font-heading text-lg text-text">
              {t.pendingTitle}
              <span className="ms-2 text-sm text-text-dim tabular" dir="ltr">
                ({pending.length})
              </span>
            </h3>
            {pending.length === 0 ? (
              <p className="text-text-dim text-sm">{t.empty}</p>
            ) : (
              renderRows(pending)
            )}
          </section>
          <section className="flex flex-col gap-4">
            <h3 className="font-heading text-lg text-text">
              {t.approvedTitle}
              <span className="ms-2 text-sm text-text-dim tabular" dir="ltr">
                ({approved.length})
              </span>
            </h3>
            {approved.length === 0 ? (
              <p className="text-text-dim text-sm">{t.empty}</p>
            ) : (
              renderRows(approved)
            )}
          </section>
        </>
      )}
    </div>
  );
}
