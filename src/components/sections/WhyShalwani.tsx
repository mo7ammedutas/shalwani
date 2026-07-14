import type { Dictionary } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Three arguments, set as a numbered ledger — not an icon-card grid. */
export function WhyShalwani({ dict }: { dict: Dictionary }) {
  return (
    <section className="mx-auto max-w-6xl px-5 md:px-8 py-24 md:py-32 flex flex-col gap-14">
      <SectionHeading eyebrow={dict.why.eyebrow} title={dict.why.title} />

      <ol className="flex flex-col hairline-b">
        {dict.why.items.map((item, i) => (
          <li
            key={item.title}
            className="grid gap-4 py-10 hairline-t md:grid-cols-12 md:items-baseline"
          >
            <span
              aria-hidden
              className="font-display text-2xl text-accent-dark tabular md:col-span-2"
              dir="ltr"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-heading text-xl text-text md:col-span-4">{item.title}</h3>
            <p className="text-text-dim leading-loose md:col-span-6">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
