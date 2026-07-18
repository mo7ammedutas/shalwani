import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { SOCIAL } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Informational tailoring section — deliberately NOT an order flow.
 * Dishdasha tailoring requires in-person measurement at the shop, so the
 * only calls to action here are WhatsApp booking and the contact page.
 */
export function TailoringSection({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.tailoring;
  return (
    <section className="hairline-t bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-24 md:py-32 flex flex-col gap-14">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} />
        <p className="max-w-3xl text-text-dim leading-loose">{t.body}</p>

        <div className="flex flex-col gap-6">
          <h3 className="type-label text-text-dim">{t.fabricsTitle}</h3>
          <ul className="grid gap-px hairline-t hairline-b sm:grid-cols-2 lg:grid-cols-4">
            {t.fabrics.map((fabric, i) => (
              <li key={fabric.name} className="flex flex-col gap-2 bg-bg px-5 py-8">
                <span
                  aria-hidden
                  className="font-display text-xl text-accent-dark tabular"
                  dir="ltr"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-heading text-lg leading-snug text-text">{fabric.name}</span>
                <span className="text-sm text-text-dim">{fabric.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start gap-4">
          <ButtonLink
            href={SOCIAL.whatsapp}
            target="_blank"
            rel="noopener"
            variant="primary"
            data-testid="tailoring-whatsapp"
          >
            {t.cta}
          </ButtonLink>
          <Link
            href={`/${locale}/contact`}
            className="text-sm text-text-dim underline underline-offset-4 hover:text-accent-light"
          >
            {t.visitNote}
          </Link>
        </div>
      </div>
    </section>
  );
}
