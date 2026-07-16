import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { requireSection } from "@/lib/admin-guard";
import { ButtonLink } from "@/components/ui/Button";
import { deleteStaff, setStaffActive } from "@/app/[locale]/admin/actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export default async function AdminStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  const [{ locale: raw }, notice] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "staff");
  const dict = getDictionary(locale);
  const t = dict.admin.staff;

  const [staff, me] = await Promise.all([
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
    getCurrentAdmin(),
  ]);

  const noticeText = notice.deleted
    ? t.deleted
    : notice.error === "self"
      ? t.cannotModifySelf
      : notice.saved
        ? t.saved
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl text-text">{t.title}</h2>
        <ButtonLink href={`/${locale}/admin/staff/new`} variant="primary" data-testid="new-staff">
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

      {staff.length === 0 ? (
        <p className="py-14 text-center text-text-dim">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm" data-testid="staff-table">
            <thead>
              <tr className="hairline-b text-text-dim">
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colName}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colEmail}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colRole}</th>
                <th className="py-3 pe-4 text-start font-normal type-label">{t.colStatus}</th>
                <th className="py-3 text-start font-normal type-label"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const isSelf = s.id === me?.id;
                return (
                  <tr key={s.id} className="hairline-b align-middle" data-testid={`staff-row-${s.email}`}>
                    <td className="py-3 pe-4 text-text">
                      {s.name} {isSelf ? <span className="text-text-dim">{t.you}</span> : null}
                    </td>
                    <td className="py-3 pe-4 tabular text-text-dim" dir="ltr">
                      {s.email}
                    </td>
                    <td className="py-3 pe-4 text-text">{t.roles[s.role] ?? s.role}</td>
                    <td className="py-3 pe-4">
                      <span
                        className={`type-label ${s.active ? "text-accent-light" : "text-accent-secondary"}`}
                      >
                        {s.active ? t.statusActive : t.statusInactive}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-4">
                        {!isSelf ? (
                          <form action={setStaffActive.bind(null, locale, s.id, !s.active)}>
                            <button
                              type="submit"
                              className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light cursor-pointer"
                            >
                              {s.active ? t.deactivate : t.activate}
                            </button>
                          </form>
                        ) : null}
                        <Link
                          href={`/${locale}/admin/staff/${s.id}`}
                          className="text-sm text-accent-light underline underline-offset-4"
                          data-testid={`edit-staff-${s.email}`}
                        >
                          {t.edit}
                        </Link>
                        {!isSelf ? (
                          <DeleteProductButton
                            action={deleteStaff.bind(null, locale, s.id)}
                            label={t.delete}
                            confirmText={t.confirmDelete}
                            testId={`delete-staff-${s.email}`}
                          />
                        ) : null}
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
