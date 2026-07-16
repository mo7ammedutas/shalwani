import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { requireSection } from "@/lib/admin-guard";
import { updateSettings } from "@/app/[locale]/admin/actions";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ locale: raw }, { saved }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "settings");
  const dict = getDictionary(locale);
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl text-text">{dict.admin.settings.title}</h2>
      {saved ? (
        <p
          role="status"
          data-testid="admin-notice"
          className="border border-accent-light bg-surface px-4 py-3 text-sm text-accent-light"
        >
          {dict.admin.settings.saved}
        </p>
      ) : null}
      <SettingsForm dict={dict} action={updateSettings.bind(null, locale)} settings={settings} />
    </div>
  );
}
