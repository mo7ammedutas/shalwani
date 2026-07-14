import { headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/Button";
import { BrandSeal } from "@/components/ui/icons";

/** 404 — locale comes from the x-locale header stamped by the proxy. */
export default async function NotFound() {
  const headerLocale = (await headers()).get("x-locale");
  const locale: Locale =
    headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-5 md:px-8 pt-20 pb-28 flex flex-col items-center gap-8 text-center">
      <div className="flex items-center gap-4 text-accent-dark" aria-hidden>
        <span className="font-display text-5xl tabular" dir="ltr">
          4
        </span>
        <BrandSeal className="size-10" />
        <span className="font-display text-5xl tabular" dir="ltr">
          4
        </span>
      </div>
      <h1 className="font-heading text-3xl text-text">{dict.notFound.title}</h1>
      <p className="max-w-prose text-text-dim leading-loose">{dict.notFound.body}</p>
      <ButtonLink href={`/${locale}`} variant="primary" className="mt-2">
        {dict.notFound.cta}
      </ButtonLink>
    </div>
  );
}
