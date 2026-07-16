import type { SVGProps } from "react";

/** Hairline stroke icon set — no emoji, no filled blobs. */

function base(props: SVGProps<SVGSVGElement>) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function IconBag(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M5 8h14l-1.2 12.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8Z" />
      <path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  );
}

export function IconWhatsApp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5Z" />
      <path d="M9 8.8c-.3 1.8 2.4 5.6 5.5 6.3.9.2 1.9-.4 2-1.2l.1-.6-2-1-.9.8c-1-.4-2.3-1.7-2.7-2.7l.8-.9-1-2-.6.1c-.6.1-1.1.6-1.2 1.2Z" />
    </svg>
  );
}

export function IconInstagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 7.5h16M4 12h16M4 16.5h10" />
    </svg>
  );
}

export function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconArrow(props: SVGProps<SVGSVGElement>) {
  // Points forward in reading direction; parent flips it for RTL via rtl:-scale-x-100
  return (
    <svg {...base(props)}>
      <path d="M4 12h16m0 0-6-6m6 6-6 6" />
    </svg>
  );
}

export function IconMinus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  );
}

export function IconHeart({
  filled = false,
  ...props
}: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg {...base(props)} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20s-7-4.35-9.5-8.8C.9 8 2.2 4.5 5.6 4A5 5 0 0 1 12 7.2 5 5 0 0 1 18.4 4c3.4.5 4.7 4 3.1 7.2C19 15.65 12 20 12 20Z" />
    </svg>
  );
}

/** Brand seal: the diamond stitch used across the identity. */
export function BrandSeal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)} viewBox="0 0 24 24">
      <path d="M12 3l7 9-7 9-7-9 7-9Z" />
      <path d="M12 8l3.5 4-3.5 4-3.5-4L12 8Z" />
    </svg>
  );
}
