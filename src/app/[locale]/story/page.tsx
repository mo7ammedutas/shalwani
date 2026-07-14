import type { Metadata } from "next";
import Image from "next/image";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
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

const SECTION_IMAGES = [
  "/products/massar-al-layl-2.svg",
  "/products/massar-al-annabi-2.svg",
  "/products/massar-al-aaji-2.svg",
  null, // the promise closes on text alone
];

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20 flex flex-col gap-20">
      <header className="max-w-2xl flex flex-col gap-6">
        <SectionHeading as="h1" eyebrow={dict.brand.tagline} title={dict.story.title} />
        <p className="font-heading text-xl text-text-dim leading-loose">{dict.story.intro}</p>
      </header>

      <div className="flex flex-col">
        {dict.story.sections.map((section, i) => {
          const image = SECTION_IMAGES[i % SECTION_IMAGES.length];
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

      <div className="flex justify-center hairline-t pt-16">
        <ButtonLink href={`/${locale}/shop`} variant="primary">
          {dict.story.cta}
        </ButtonLink>
      </div>
    </div>
  );
}
