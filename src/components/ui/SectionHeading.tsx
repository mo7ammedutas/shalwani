import type { ReactNode } from "react";

/** Eyebrow + heading pair used to open every section. */
export function SectionHeading({
  eyebrow,
  title,
  align = "start",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2" | "h3";
}) {
  const alignment = align === "center" ? "text-center items-center" : "text-start items-start";
  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow ? (
        <p className="text-sm tracking-[0.22em] uppercase text-accent-light font-body">
          {eyebrow}
        </p>
      ) : null}
      <Tag className="font-heading text-3xl md:text-4xl leading-[1.25] text-text max-w-[24ch]">
        {title}
      </Tag>
    </div>
  );
}
