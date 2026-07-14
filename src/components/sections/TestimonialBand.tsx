import type { Dictionary } from "@/lib/i18n";
import { BrandSeal } from "@/components/ui/icons";

export function TestimonialBand({ dict }: { dict: Dictionary }) {
  return (
    <section className="hairline-t hairline-b bg-surface/40">
      <figure className="mx-auto max-w-4xl px-5 md:px-8 py-24 md:py-28 flex flex-col items-center gap-8 text-center">
        <BrandSeal className="size-7 text-accent" />
        <blockquote>
          <p className="font-heading text-2xl md:text-3xl leading-[1.6] text-text">
            «{dict.testimonial.quote}»
          </p>
        </blockquote>
        <figcaption className="flex flex-col gap-1">
          <span className="text-base text-surface-cream">{dict.testimonial.name}</span>
          <span className="text-sm text-text-dim">{dict.testimonial.role}</span>
        </figcaption>
      </figure>
    </section>
  );
}
