import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconArrow } from "@/components/ui/icons";

export function StoryTeaser({
  locale,
  dict,
  imageUrl,
}: {
  locale: Locale;
  dict: Dictionary;
  imageUrl?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 md:px-8 py-24 md:py-32">
      <div className="grid items-center gap-12 md:grid-cols-12">
        {/* Detail shot, deliberately off-balance — merchant-managed via
            Settings → Branding, placeholder art until then. */}
        <div className="md:col-span-7 relative aspect-[4/3] overflow-hidden rounded-[var(--radius-soft)] border border-surface-muted">
          <Image
            src={imageUrl || "/products/bashmina-classic-2-2.svg"}
            alt=""
            fill
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="md:col-span-5 flex flex-col gap-6">
          <SectionHeading eyebrow={dict.storyTeaser.eyebrow} title={dict.storyTeaser.title} />
          <p className="text-text-dim leading-loose">{dict.storyTeaser.body}</p>
          <Link
            href={`/${locale}/story`}
            className="group inline-flex items-center gap-2.5 text-accent-light hover:text-accent w-fit"
          >
            {dict.storyTeaser.link}
            <IconArrow className="size-4.5 rtl:-scale-x-100 transition-transform duration-[var(--duration-calm)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
