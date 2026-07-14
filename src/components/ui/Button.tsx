import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

type Variant = "primary" | "quiet" | "danger-quiet";

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-text-on-accent hover:bg-accent-light active:bg-accent-dark border border-transparent",
  quiet:
    "bg-transparent text-text border border-surface-muted hover:border-accent hover:text-accent-light",
  "danger-quiet":
    "bg-transparent text-text border border-surface-muted hover:border-accent-secondary hover:text-surface-cream",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2.5 px-7 py-3 font-body text-base tracking-wide rounded-[var(--radius-soft)] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed select-none";

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  const external = typeof href === "string" && href.startsWith("http");
  return (
    <Link
      href={href}
      className={`${baseClasses} ${styles[variant]} ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button className={`${baseClasses} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
