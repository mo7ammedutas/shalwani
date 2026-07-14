import type { Metadata } from "next";
import { isLocale, SOCIAL, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/Button";
import { IconWhatsApp } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : "ar");
  return { title: dict.cancel.title, robots: { index: false } };
}

export default async function CancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-5 md:px-8 pt-40 pb-32 flex flex-col items-center gap-8 text-center">
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-full border border-accent-secondary text-accent-secondary font-display text-xl"
      >
        !
      </span>
      <h1 className="font-heading text-3xl md:text-4xl text-text">{dict.cancel.title}</h1>
      <p className="max-w-prose text-text-dim leading-loose">{dict.cancel.body}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <ButtonLink href={`/${locale}/checkout`} variant="primary">
          {dict.cancel.retry}
        </ButtonLink>
        <ButtonLink href={`/${locale}/cart`} variant="quiet">
          {dict.cancel.backToCart}
        </ButtonLink>
        <ButtonLink href={SOCIAL.whatsapp} variant="quiet">
          <IconWhatsApp className="size-4.5" />
          {dict.cancel.support}
        </ButtonLink>
      </div>
    </div>
  );
}
