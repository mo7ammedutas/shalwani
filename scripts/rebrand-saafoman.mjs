/**
 * Rebrands the local HTTrack mirror of saafoman.com into Shalwani:
 *  - overwrites the logo image files (same filenames — no markup surgery)
 *  - swaps the saafoman brand palette for the Shalwani tokens
 *  - renames the visible store name (SAAF OMAN → SHALWANI) and logo alt
 *  - strips srcset attributes that point at the live saafoman.com so the
 *    mirror renders fully offline from the downloaded files
 *
 * Design, layout, structure and behaviour stay untouched.
 *
 * Run from shalwani/:  node scripts/rebrand-saafoman.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const MIRROR = "C:\\Users\\Mohammed UTAS\\Downloads\\impeccable-main\\impeccable-main\\saafoman-musar";
const SITE = join(MIRROR, "saafoman.com");
const LOGO_PREFIX = "PHOTO-2024-03-18-20-26-38";

/* ---------- 1. collect files ---------- */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(SITE);
const htmlCss = files.filter((f) => /\.(html?|css)$/i.test(f));
const logoFiles = files.filter((f) => f.includes(LOGO_PREFIX) && /\.jpe?g$/i.test(f));

/* ---------- 2. render the Shalwani logo at each needed size ---------- */
const logoHtml = (size) => `<!doctype html><html><head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Playfair+Display:ital@1&display=swap');
  body { margin:0; width:${size}px; height:${size}px; background:#ffffff;
         display:flex; align-items:center; justify-content:center; }
  .disc { width:${size * 0.94}px; height:${size * 0.94}px; border-radius:50%;
          background:#12182a; display:flex; flex-direction:column;
          align-items:center; justify-content:center; }
  .ar { font-family:'Aref Ruqaa', serif; font-weight:700; color:#ede6d8;
        font-size:${size * 0.30}px; line-height:1; margin-top:-${size * 0.04}px; }
  .en { font-family:'Playfair Display', serif; font-style:italic; color:#ede6d8;
        font-size:${size * 0.11}px; margin-top:${size * 0.015}px; }
</style></head>
<body><div class="disc"><div class="ar">شالواني</div><div class="en">shalwani</div></div></body></html>`;

async function renderLogos() {
  const browser = await chromium.launch();
  const sizes = new Map(); // size -> [files]
  for (const f of logoFiles) {
    const m = f.match(/_(\d+)x(?:@2x)?/);
    let size = m ? parseInt(m[1], 10) : 600;
    if (/@2x/.test(f)) size *= 2;
    if (!sizes.has(size)) sizes.set(size, []);
    sizes.get(size).push(f);
  }
  for (const [size, targets] of sizes) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(logoHtml(size), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const jpeg = await page.screenshot({ type: "jpeg", quality: 92 });
    for (const t of targets) writeFileSync(t, jpeg);
    await page.close();
    console.log(`logo ${size}px → ${targets.length} file(s)`);
  }
  await browser.close();
}

/* ---------- 3. palette + brand text swaps ---------- */
const swaps = [
  // saafoman olive-gold accent → Shalwani deep lazuli (AA on white)
  [/#897b00/gi, "#3c5f94"],
  // bright yellow meta → Shalwani accent light
  [/#efd700/gi, "#a8c2e8"],
  [/rgba\(137,\s*123,\s*0/gi, "rgba(60, 95, 148"],
  [/rgba\(239,\s*215,\s*0/gi, "rgba(168, 194, 232"],
  // black buttons → midnight navy (CSS variable declarations only)
  [/(--color-[a-z-]*button[a-z-]*-(?:bg|border)[a-z-]*:\s*)#000(?:000)?\b/gi, "$1#12182a"],
  [/(--color-[a-z-]*button[a-z-]*-text[a-z-]*:\s*)#fff(?:fff)?\b/gi, "$1#ede6d8"],
  // brand name + logo alt
  [/SAAF OMAN - Official website\s*/g, "شالواني | Shalwani"],
  [/SAAF OMAN/g, "SHALWANI"],
  [/Saaf Oman/g, "Shalwani"],
  [/صاف عُ?مان/g, "شالواني"],
  // srcset / data-srcset that call the live site — drop so local files render
  [/\s(?:data-)?srcset="[^"]*saafoman\.com[^"]*"/gi, ""],
];

function rebrandText() {
  let touched = 0;
  for (const f of htmlCss) {
    const before = readFileSync(f, "utf8");
    let after = before;
    for (const [re, to] of swaps) after = after.replace(re, to);
    if (after !== before) {
      writeFileSync(f, after);
      touched++;
    }
  }
  console.log(`rewrote ${touched}/${htmlCss.length} html/css files`);
}

console.log(`mirror: ${files.length} files · ${htmlCss.length} html/css · ${logoFiles.length} logo images`);
await renderLogos();
rebrandText();
console.log("REBRAND_DONE");
