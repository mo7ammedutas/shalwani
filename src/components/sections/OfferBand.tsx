import { SOCIAL } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Seasonal-offer banner — informational only. The offer applies to
 * dishdasha tailoring (measured in person), so the CTA goes to WhatsApp,
 * never to a checkout flow.
 */
export function OfferBand({ dict }: { dict: Dictionary }) {
  const t = dict.offer;
  return (
    <section className="hairline-t hairline-b bg-accent-dark/15">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 md:py-20 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="type-label text-accent-light">{t.eyebrow}</span>
          <h2 className="font-heading text-2xl md:text-3xl leading-snug text-text">{t.title}</h2>
          <p className="max-w-2xl text-text-dim leading-relaxed">{t.body}</p>
        </div>
        <ButtonLink
          href={SOCIAL.whatsapp}
          target="_blank"
          rel="noopener"
          variant="primary"
          className="shrink-0"
          data-testid="offer-whatsapp"
        >
          {t.cta}
        </ButtonLink>
      </div>
    </section>
  );
}
