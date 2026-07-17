import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { totpProvisioningUri } from "@/lib/totp";
import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  disableTotp,
} from "@/app/[locale]/admin/actions";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

/** Per-account security settings — reachable by every signed-in staff
 * member regardless of role (it only ever touches their own account). */
export default async function AdminSecurityPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ secret?: string; error?: string; enabled?: string; disabled?: string }>;
}) {
  const [{ locale: raw }, sp] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  const dict = getDictionary(locale);
  const t = dict.admin.security;

  const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  const enrolled = Boolean(user?.totpSecret);
  const pendingSecret = !enrolled && sp.secret ? sp.secret : null;

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <h2 className="font-heading text-xl text-text">{t.title}</h2>

      {sp.enabled ? (
        <p role="status" data-testid="admin-notice" className="border border-accent-light bg-surface px-4 py-3 text-sm text-accent-light">
          {t.enabled}
        </p>
      ) : sp.disabled ? (
        <p role="status" data-testid="admin-notice" className="border border-accent-light bg-surface px-4 py-3 text-sm text-accent-light">
          {t.disabled}
        </p>
      ) : null}

      <section className="flex flex-col gap-5 border border-surface-muted p-6">
        <h3 className="font-heading text-lg text-text">{t.totpTitle}</h3>
        <p className="text-sm text-text-dim leading-relaxed">{t.totpIntro}</p>

        <p className={`text-sm ${enrolled ? "text-accent-light" : "text-text-dim"}`} data-testid="totp-status">
          {enrolled ? t.statusEnabled : t.statusDisabled}
        </p>

        {enrolled ? (
          <DeleteProductButton
            action={disableTotp.bind(null, locale)}
            label={t.disable}
            confirmText={t.confirmDisable}
            testId="disable-totp"
          />
        ) : pendingSecret ? (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className="text-sm text-text mb-2">{t.setupTitle}</h4>
              <p className="text-sm text-text-dim mb-3">{t.setupStep1}</p>
              <p className="type-label text-text-dim mb-1">{t.secretLabel}</p>
              <code
                dir="ltr"
                className="block w-fit select-all border border-surface-muted bg-surface px-3 py-2 text-sm text-accent-light tabular tracking-widest"
                data-testid="totp-secret"
              >
                {pendingSecret}
              </code>
              <a
                dir="ltr"
                href={totpProvisioningUri(pendingSecret, admin.email)}
                className="mt-2 inline-block text-xs text-text-dim underline underline-offset-4 break-all hover:text-accent-light"
              >
                {totpProvisioningUri(pendingSecret, admin.email)}
              </a>
            </div>

            <form action={confirmTotpEnrollment.bind(null, locale)} className="flex flex-col gap-3">
              <input type="hidden" name="secret" value={pendingSecret} />
              <p className="text-sm text-text-dim">{t.setupStep2}</p>
              {sp.error ? (
                <p role="alert" className="text-sm text-accent-secondary">
                  {t.invalidCode}
                </p>
              ) : null}
              <div className="max-w-40">
                <Label htmlFor="totp-code">{t.codeLabel}</Label>
                <TextInput
                  id="totp-code"
                  name="code"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  minLength={6}
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="000000"
                  data-testid="totp-code"
                />
              </div>
              <Button type="submit" variant="primary" className="self-start" data-testid="confirm-totp">
                {t.confirm}
              </Button>
            </form>
          </div>
        ) : (
          <form action={beginTotpEnrollment.bind(null, locale)}>
            <Button type="submit" variant="primary" data-testid="enable-totp">
              {t.enable}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
