import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { requireSection } from "@/lib/admin-guard";
import { createStaff } from "@/app/[locale]/admin/actions";
import { StaffForm } from "@/components/admin/StaffForm";

export default async function NewStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw }, { error }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "staff");
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading text-xl text-text">{dict.admin.staff.form.createTitle}</h2>
      <StaffForm dict={dict} action={createStaff.bind(null, locale)} showError={error} />
    </div>
  );
}
