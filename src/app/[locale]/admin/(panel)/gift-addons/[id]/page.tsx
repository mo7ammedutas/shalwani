import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { updateGiftAddon } from "@/app/[locale]/admin/actions";
import { GiftAddonForm } from "@/components/admin/GiftAddonForm";
import { requireSection } from "@/lib/admin-guard";

export default async function EditGiftAddonPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw, id }, { error }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "giftAddons");
  const dict = getDictionary(locale);

  const addon = await prisma.giftAddon.findUnique({ where: { id } });
  if (!addon) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading text-xl text-text">
        {dict.admin.giftAddons.form.editTitle} —{" "}
        <span className="text-text-dim">{locale === "ar" ? addon.nameAr : addon.nameEn}</span>
      </h2>
      <GiftAddonForm
        dict={dict}
        action={updateGiftAddon.bind(null, locale, addon.id)}
        addon={addon}
        showError={!!error}
      />
    </div>
  );
}
