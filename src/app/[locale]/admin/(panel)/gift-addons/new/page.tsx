import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { createGiftAddon } from "@/app/[locale]/admin/actions";
import { GiftAddonForm } from "@/components/admin/GiftAddonForm";
import { requireSection } from "@/lib/admin-guard";

export default async function NewGiftAddonPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw }, { error }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "giftAddons");
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading text-xl text-text">{dict.admin.giftAddons.form.createTitle}</h2>
      <GiftAddonForm dict={dict} action={createGiftAddon.bind(null, locale)} showError={!!error} />
    </div>
  );
}
