/**
 * Generates placeholder product art: hand-drawn-style SVGs of folded
 * pashmina massars showing an embroidered band, in the style of the
 * boutique's reference photography (triangular fold, visible border).
 *
 * Run: node scripts/generate-placeholders.mjs
 * Output: public/products/<slug>-1.svg (folded piece)
 *         public/products/<slug>-2.svg (embroidery detail)
 *         public/hero.svg (homepage hero backdrop)
 *
 * These are stand-ins until real photography replaces them (README §Content).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "products");
mkdirSync(outDir, { recursive: true });

/** Fabric palettes per color slug — art assets, tuned to sit inside the site's navy/cream world. */
const FABRICS = {
  midnight: { base: "#1c2645", lite: "#28345c", dark: "#141b33", thread: "#a8c2e8", thread2: "#dcd1bc" },
  lazuli: { base: "#2a4a7e", lite: "#38598f", dark: "#1e3a68", thread: "#dcd1bc", thread2: "#a8c2e8" },
  burgundy: { base: "#5a2230", lite: "#6d2c3c", dark: "#471a26", thread: "#dcd1bc", thread2: "#e8c9b0" },
  ivory: { base: "#d8ccb4", lite: "#e4dac6", dark: "#c4b698", thread: "#3c5f94", thread2: "#8b2635" },
  slate: { base: "#3d4d6b", lite: "#4a5b7c", dark: "#31405c", thread: "#ede6d8", thread2: "#a8c2e8" },
  ink: { base: "#131828", lite: "#1d2436", dark: "#0d111d", thread: "#6b93d6", thread2: "#a8c2e8" },
};

const BACKDROP = "#151b2c";

/** One embroidery motif unit, drawn in thread color, ~72px wide, centered at origin. */
function motif(kind, f, scale = 1) {
  const t = f.thread;
  const t2 = f.thread2;
  const g = (inner) => `<g transform="scale(${scale})">${inner}</g>`;
  switch (kind) {
    case "kashmiri": // paisley curl
      return g(`
        <path d="M0,16 C-16,4 -14,-18 4,-22 C20,-25 30,-12 24,2 C20,12 10,18 0,16 Z"
          fill="none" stroke="${t}" stroke-width="2.4"/>
        <path d="M4,8 C-4,2 -2,-10 8,-12" fill="none" stroke="${t}" stroke-width="1.6"/>
        <circle cx="9" cy="-2" r="2" fill="${t2}"/>
        <path d="M0,16 C-6,24 -14,26 -20,24" fill="none" stroke="${t}" stroke-width="1.6"/>`);
    case "geometric": // nested Omani diamonds
      return g(`
        <path d="M0,-22 L20,0 L0,22 L-20,0 Z" fill="none" stroke="${t}" stroke-width="2.4"/>
        <path d="M0,-12 L11,0 L0,12 L-11,0 Z" fill="none" stroke="${t}" stroke-width="1.6"/>
        <circle cx="0" cy="0" r="2.4" fill="${t2}"/>
        <path d="M0,-22 L0,-28 M0,22 L0,28" stroke="${t}" stroke-width="1.6"/>`);
    case "floral": // eight-petal blossom on a vine
      return g(`
        ${[0, 45, 90, 135].map((a) => `<ellipse cx="0" cy="-13" rx="4.5" ry="12" fill="none" stroke="${t}" stroke-width="1.8" transform="rotate(${a})"/><ellipse cx="0" cy="13" rx="4.5" ry="12" fill="none" stroke="${t}" stroke-width="1.8" transform="rotate(${a})"/>`).join("")}
        <circle cx="0" cy="0" r="3.4" fill="${t2}"/>`);
    case "border": // dense bar-and-dot band
    default:
      return g(`
        <path d="M-24,-18 L-24,18 M-12,-18 L-12,18 M0,-18 L0,18 M12,-18 L12,18 M24,-18 L24,18"
          stroke="${t}" stroke-width="2.2"/>
        <circle cx="-18" cy="0" r="2" fill="${t2}"/><circle cx="-6" cy="0" r="2" fill="${t2}"/>
        <circle cx="6" cy="0" r="2" fill="${t2}"/><circle cx="18" cy="0" r="2" fill="${t2}"/>`);
  }
}

/** A horizontal embroidered band: motif row between hairline rules. */
function band(kind, f, x, y, width, unit = 84, scale = 1) {
  const n = Math.floor(width / unit);
  const pad = (width - n * unit) / 2;
  let uses = "";
  for (let i = 0; i < n; i++) {
    uses += `<g transform="translate(${x + pad + unit * i + unit / 2},${y})">${motif(kind, f, scale)}</g>`;
  }
  const rule = (dy) =>
    `<line x1="${x}" y1="${y + dy}" x2="${x + width}" y2="${y + dy}" stroke="${f.thread}" stroke-width="1.4" opacity="0.85"/>` +
    `<line x1="${x}" y1="${y + dy + (dy > 0 ? 6 : -6)}" x2="${x + width}" y2="${y + dy + (dy > 0 ? 6 : -6)}" stroke="${f.thread}" stroke-width="0.8" opacity="0.5"/>`;
  return rule(-34 * scale) + uses + rule(34 * scale);
}

/** Weave texture as a subtle line pattern. */
function weaveDefs(id, f) {
  return `
  <pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
    <rect width="7" height="7" fill="${f.base}"/>
    <line x1="0" y1="0" x2="0" y2="7" stroke="${f.lite}" stroke-width="1" opacity="0.5"/>
    <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="${f.dark}" stroke-width="0.7" opacity="0.55"/>
  </pattern>`;
}

/** View 1 — the folded massar, point down, embroidered end laid across the top. */
function foldedView(slug, kind, f) {
  const W = 1200;
  const H = 1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="">
  <defs>
    ${weaveDefs(`weave-${slug}`, f)}
    <linearGradient id="sheen-${slug}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.22"/>
    </linearGradient>
    <radialGradient id="vign-${slug}" cx="0.5" cy="0.34" r="0.95">
      <stop offset="0" stop-color="#232c47"/>
      <stop offset="1" stop-color="${BACKDROP}"/>
    </radialGradient>
    <clipPath id="tri-${slug}">
      <path d="M110,320 L1090,320 L600,1330 Z"/>
    </clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#vign-${slug})"/>
  <ellipse cx="600" cy="1250" rx="430" ry="70" fill="#000000" opacity="0.30"/>
  <path d="M150,290 L1120,340 L640,1360 Z" fill="${f.dark}" opacity="0.85"/>
  <g clip-path="url(#tri-${slug})">
    <rect x="60" y="270" width="1080" height="1120" fill="url(#weave-${slug})"/>
    <rect x="60" y="270" width="1080" height="1120" fill="url(#sheen-${slug})"/>
    ${band(kind, f, 60, 430, 1080, 92, 1.15)}
    ${band(kind, f, 60, 560, 1080, 92, 0.55)}
    <line x1="60" y1="320" x2="1140" y2="320" stroke="${f.lite}" stroke-width="3" opacity="0.7"/>
  </g>
  <path d="M110,320 L1090,320 L600,1330 Z" fill="none" stroke="${f.dark}" stroke-width="3" opacity="0.8"/>
  <g transform="translate(600,1408)" opacity="0.5">
    <path d="M0,-14 L11,0 L0,14 L-11,0 Z" fill="none" stroke="#6b93d6" stroke-width="1.6"/>
    <circle cx="0" cy="0" r="2" fill="#6b93d6"/>
  </g>
</svg>`;
}

/** View 2 — close-up of the embroidered band across the full frame. */
function detailView(slug, kind, f) {
  const W = 1200;
  const H = 1500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="">
  <defs>
    ${weaveDefs(`weaved-${slug}`, f)}
    <linearGradient id="shade-${slug}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0.28"/>
      <stop offset="0.35" stop-color="#000000" stop-opacity="0"/>
      <stop offset="0.75" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.34"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#weaved-${slug})"/>
  ${band(kind, f, 0, 500, W, 150, 2.1)}
  ${band(kind, f, 0, 900, W, 150, 1.0)}
  <line x1="0" y1="1120" x2="${W}" y2="1120" stroke="${f.thread}" stroke-width="2" opacity="0.6"/>
  <rect width="${W}" height="${H}" fill="url(#shade-${slug})"/>
</svg>`;
}

/** Homepage hero backdrop: a wide, dim archive-room still life. */
function heroView() {
  const f = FABRICS.midnight;
  const W = 2400;
  const H = 1600;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="">
  <defs>
    ${weaveDefs("weave-hero", f)}
    <radialGradient id="vign-hero" cx="0.5" cy="0.28" r="1.05">
      <stop offset="0" stop-color="#1e2740"/>
      <stop offset="0.65" stop-color="#12182a"/>
      <stop offset="1" stop-color="#0e1424"/>
    </radialGradient>
    <linearGradient id="floor-hero" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0e1424" stop-opacity="0"/>
      <stop offset="1" stop-color="#0e1424" stop-opacity="0.9"/>
    </linearGradient>
    <clipPath id="tri-hero"><path d="M1310,520 L2260,560 L1800,1400 Z"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#vign-hero)"/>
  <path d="M320,1600 L320,560 A340,380 0 0 1 1000,560 L1000,1600 Z" fill="none" stroke="#2e3a54" stroke-width="2" opacity="0.5"/>
  <path d="M400,1600 L400,600 A260,300 0 0 1 920,600 L920,1600 Z" fill="none" stroke="#2e3a54" stroke-width="1.2" opacity="0.4"/>
  <ellipse cx="1800" cy="1330" rx="420" ry="56" fill="#000" opacity="0.35"/>
  <path d="M1345,500 L2285,585 L1835,1425 Z" fill="${f.dark}" opacity="0.85"/>
  <g clip-path="url(#tri-hero)">
    <rect x="1280" y="480" width="1020" height="960" fill="url(#weave-hero)"/>
    ${band("geometric", f, 1280, 640, 1020, 96, 1.0)}
    ${band("geometric", f, 1280, 750, 1020, 96, 0.5)}
  </g>
  <path d="M1310,520 L2260,560 L1800,1400 Z" fill="none" stroke="${f.dark}" stroke-width="3" opacity="0.8"/>
  <rect width="${W}" height="${H}" fill="url(#floor-hero)"/>
</svg>`;
}

const PRODUCTS = [
  // Real catalogue lines (keep in sync with prisma/seed.ts)
  ["super-turma", "border", "slate"],
  ["bashmina-classic-1", "geometric", "midnight"],
  ["bashmina-classic-2", "kashmiri", "lazuli"],
  ["bashmina-vip-1", "floral", "burgundy"],
  ["bashmina-vip-2", "kashmiri", "ink"],
  ["sanjin-i", "kashmiri", "ivory"],
  ["sanjin-ii", "kashmiri", "midnight"],
  ["sanjin-vvip", "kashmiri", "ink"],
];

for (const [slug, kind, color] of PRODUCTS) {
  const f = FABRICS[color];
  writeFileSync(join(outDir, `${slug}-1.svg`), foldedView(slug, kind, f));
  writeFileSync(join(outDir, `${slug}-2.svg`), detailView(slug, kind, f));
}
writeFileSync(join(root, "public", "hero.svg"), heroView());
console.log(`Generated ${PRODUCTS.length * 2} product placeholders + hero.svg`);
