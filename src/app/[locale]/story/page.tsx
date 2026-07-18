import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : "ar");
  return { title: dict.story.title, description: dict.story.intro };
}

/** Bundled placeholder art, used per section index until the admin
 * uploads a real photo for that slot (Settings → Branding → 'Our Story'
 * page images). The last section defaults to no image — a text-only
 * closing block — unless the admin explicitly uploads one. */
const PLACEHOLDER_IMAGES: (string | null)[] = [
  "/products/bashmina-classic-1-2.svg",
  "/products/sanjin-i-2.svg",
  "/products/bashmina-classic-2-2.svg",
  "/products/bashmina-vip-2-2.svg",
  null,
];

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const settings = await getSettings();
  const sectionImages = dict.story.sections.map(
    (_, i) => settings.storyImageUrls[i] || PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20 flex flex-col gap-20">
      <header className="max-w-2xl flex flex-col gap-6">
        <SectionHeading as="h1" eyebrow={dict.brand.tagline} title={dict.story.title} />
        <p className="font-heading text-xl text-text-dim leading-loose">{dict.story.intro}</p>
      </header>

      <div className="flex flex-col">
        {dict.story.sections.map((section, i) => {
          const image = sectionImages[i];
          const flip = i % 2 === 1;
          return (
            <section
              key={section.title}
              className="grid items-center gap-10 py-16 hairline-t md:grid-cols-12"
            >
              {image ? (
                <div
                  className={`relative aspect-[5/4] overflow-hidden rounded-[var(--radius-soft)] border border-surface-muted md:col-span-5 ${
                    flip ? "md:order-2 md:col-start-8" : ""
                  }`}
                >
                  <Image src={image} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
                </div>
              ) : null}
              <div
                className={`flex flex-col gap-5 ${
                  image ? "md:col-span-6" + (flip ? " md:col-start-1 md:row-start-1" : " md:col-start-7") : "md:col-span-8 md:col-start-3 text-center items-center"
                }`}
              >
                <h2 className="font-heading text-2xl md:text-3xl text-text">{section.title}</h2>
                <p className="text-text-dim leading-loose">{section.body}</p>
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-8 hairline-t pt-16 text-center">
        <p className="max-w-2xl text-text-dim leading-loose">
          {dict.story.location}{" "}
          <Link
            href={`/${locale}/contact`}
            className="text-accent-light underline underline-offset-4"
          >
            {dict.story.locationCta}
          </Link>
        </p>
        <ButtonLink href={`/${locale}/shop`} variant="primary">
          {dict.story.cta}
        </ButtonLink>
      </div>
    </div>
  );
}
