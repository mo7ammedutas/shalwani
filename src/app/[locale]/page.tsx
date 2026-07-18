import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getFeatured } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { Hero } from "@/components/sections/Hero";
import { StoryTeaser } from "@/components/sections/StoryTeaser";
import { FeaturedCollection } from "@/components/sections/FeaturedCollection";
import { TailoringSection } from "@/components/sections/TailoringSection";
import { OfferBand } from "@/components/sections/OfferBand";
import { WhyShalwani } from "@/components/sections/WhyShalwani";
import { TestimonialBand } from "@/components/sections/TestimonialBand";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const [featured, settings] = await Promise.all([getFeatured(), getSettings()]);

  return (
    <>
      <Hero locale={locale} dict={dict} imageUrl={settings.heroImageUrl} />
      <StoryTeaser locale={locale} dict={dict} imageUrl={settings.storyTeaserImageUrl} />
      <FeaturedCollection products={featured} locale={locale} dict={dict} />
      <TailoringSection locale={locale} dict={dict} />
      <OfferBand dict={dict} />
      <WhyShalwani dict={dict} />
      <TestimonialBand dict={dict} />
    </>
  );
}
