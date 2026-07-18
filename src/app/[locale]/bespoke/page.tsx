import type { Metadata } from "next";
import { isLocale, SOCIAL, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BespokeForm } from "@/components/sections/BespokeForm";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : "ar");
  return { title: dict.bespoke.title, description: dict.bespoke.intro };
}

export default async function BespokePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20 flex flex-col gap-16">
      <header className="max-w-2xl flex flex-col gap-6">
        <SectionHeading as="h1" eyebrow={dict.nav.bespoke} title={dict.bespoke.title} />
        <p className="text-text-dim leading-loose">{dict.bespoke.intro}</p>
      </header>

      <ol className="grid gap-px hairline-t hairline-b md:grid-cols-3">
        {dict.bespoke.steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-3 py-10 md:px-8 md:first:ps-0 md:last:pe-0">
            <span aria-hidden className="font-display text-2xl text-accent-dark tabular" dir="ltr">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="font-heading text-lg text-text">{step.title}</h2>
            <p className="text-text-dim leading-relaxed text-sm">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="max-w-2xl">
        <BespokeForm dict={dict} />
      </div>

      {/* Dishdasha tailoring is measured in person — deliberately outside
          the online request flow. WhatsApp booking only. */}
      <aside
        data-testid="dishdasha-card"
        className="max-w-2xl border border-surface-muted bg-surface/40 px-6 py-8 flex flex-col gap-4"
      >
        <h2 className="font-heading text-xl text-text">{dict.bespoke.dishdasha.title}</h2>
        <p className="text-text-dim leading-loose text-sm">{dict.bespoke.dishdasha.body}</p>
        <ButtonLink
          href={SOCIAL.whatsapp}
          variant="quiet"
          className="self-start"
          data-testid="dishdasha-whatsapp"
        >
          {dict.bespoke.dishdasha.cta}
        </ButtonLink>
      </aside>
    </div>
  );
}
