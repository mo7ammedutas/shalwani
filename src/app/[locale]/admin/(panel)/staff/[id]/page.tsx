import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { requireSection } from "@/lib/admin-guard";
import { updateStaff } from "@/app/[locale]/admin/actions";
import { StaffForm } from "@/components/admin/StaffForm";

export default async function EditStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw, id }, { error }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const me = await requireSection(locale, "staff");
  const dict = getDictionary(locale);

  const staff = await prisma.adminUser.findUnique({ where: { id } });
  if (!staff) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading text-xl text-text">
        {dict.admin.staff.form.editTitle} — <span className="text-text-dim">{staff.name}</span>
      </h2>
      <StaffForm
        dict={dict}
        action={updateStaff.bind(null, locale, staff.id)}
        staff={staff}
        isSelf={staff.id === me.id}
        showError={error}
      />
    </div>
  );
}
