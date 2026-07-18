import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

/** Matches the "<saltHex>:<hashHex>" format read by src/lib/password.ts —
 * duplicated here (rather than imported) so this script has no dependency
 * on the "server-only"-tagged app modules. */
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Catalogue aligned with the boutique's real Instagram lines
 * (@shalwani.om): the offers line (super turma + pashmina classes) and
 * the one-of-a-kind Sanjin luxury line. Prices are the documented real
 * prices in integer baisa (1 OMR = 1000 baisa); originalPriceBaisa is the
 * documented pre-offer price, rendered struck-through on the storefront.
 * Photography is placeholder art until the shop's real photos land.
 */
const products = [
  // ── خط العروض — نقشة صغيرة، خياطة يد ──
  {
    slug: "super-turma",
    nameAr: "مصار سوبر تورمة",
    nameEn: "Super Turma Massar",
    descriptionAr:
      "مصار سوبر تورمة بنقشة صغيرة وخياطة يد كاملة، من خط العروض. خيارٌ عمليّ أنيق يليق بالمجلس واليوم الرسمي، والتوصيل يشمل جميع الطلبات.",
    descriptionEn:
      "Super Turma massar with a fine small motif, fully hand-stitched — from our offers line. A sharp everyday choice for the majlis and formal days. Delivery included on all orders.",
    color: "slate",
    embroidery: "border",
    priceBaisa: 25000,
    stock: 10,
    featured: true,
  },
  {
    slug: "bashmina-classic-1",
    nameAr: "مصار الباشمينا — الفئة الأولى",
    nameEn: "Pashmina Massar — Class I",
    descriptionAr:
      "مصار باشمينا بنقشة صغيرة وخياطة يد، من خط العروض. فخامة تُقتنى بسعر عرضٍ صريح: سابقاً بخمسةٍ وثلاثين ريالاً، وبعد العرض بثلاثين فقط.",
    descriptionEn:
      "Hand-stitched pashmina massar with a fine small motif, from the offers line. Previously 35 OMR — now 30 during the offer.",
    color: "midnight",
    embroidery: "geometric",
    priceBaisa: 30000,
    originalPriceBaisa: 35000,
    stock: 8,
    featured: true,
  },
  {
    slug: "bashmina-classic-2",
    nameAr: "مصار الباشمينا — الفئة الثانية",
    nameEn: "Pashmina Massar — Class II",
    descriptionAr:
      "مصار باشمينا من الفئة الثانية بخياطة يد ونقشة صغيرة أدق. سابقاً بخمسةٍ وأربعين ريالاً، وبعد العرض بتسعةٍ وثلاثين فقط ✨",
    descriptionEn:
      "Class II hand-stitched pashmina massar with a finer small motif. Previously 45 OMR — now 39 during the offer ✨",
    color: "lazuli",
    embroidery: "kashmiri",
    priceBaisa: 39000,
    originalPriceBaisa: 45000,
    stock: 6,
    featured: true,
  },
  {
    slug: "bashmina-vip-1",
    nameAr: "مصار الباشمينا VIP — الفئة الأولى",
    nameEn: "Pashmina Massar VIP — Class I",
    descriptionAr:
      "من فئة VIP: باشمينا أرقى وخياطة يد أدق لمن يريد حضوراً يتقدّم المجلس. سابقاً بخمسةٍ وخمسين ريالاً، وبعد العرض بخمسين.",
    descriptionEn:
      "VIP class: finer pashmina and closer hand-stitching for a presence that leads the majlis. Previously 55 OMR — now 50.",
    color: "burgundy",
    embroidery: "floral",
    priceBaisa: 50000,
    originalPriceBaisa: 55000,
    stock: 5,
    featured: false,
  },
  {
    slug: "bashmina-vip-2",
    nameAr: "مصار الباشمينا VIP — الفئة الثانية",
    nameEn: "Pashmina Massar VIP — Class II",
    descriptionAr:
      "أعلى فئات خط العروض: باشمينا VIP بخياطة يد كاملة ونقشة دقيقة. سابقاً بخمسةٍ وستين ريالاً، وبعد العرض بتسعةٍ وخمسين فقط ✨",
    descriptionEn:
      "The top of the offers line: VIP pashmina, fully hand-stitched with an intricate motif. Previously 65 OMR — now 59 ✨",
    color: "ink",
    embroidery: "kashmiri",
    priceBaisa: 59000,
    originalPriceBaisa: 65000,
    stock: 4,
    featured: true,
  },
  // ── خط السنجين الفاخر — قطع فريدة، سعرها بحسب تعقيد التطريز ──
  {
    slug: "sanjin-i",
    nameAr: "مَصَر الباشمينا السنجين",
    nameEn: "Sanjin Pashmina Massar",
    descriptionAr:
      "فخامة تُهدى… وأناقة تُقتنى ✨ قطعة استثنائية من خط السنجين تجمع بين الرقي والأصالة، بتفاصيل راقية تليق بمن يبحث عن التميز. كما يمكن تقديمها هدية لشخص عزيز، مع لمسة تليق بقيمة المناسبة وجمال الإهداء 🎁",
    descriptionEn:
      "Elegance to gift, refinement to keep ✨ An exceptional one-of-a-kind piece from the Sanjin line, uniting grace and heritage in details made for those who seek distinction. It also makes a gift worthy of the occasion 🎁",
    color: "ivory",
    embroidery: "kashmiri",
    priceBaisa: 165000,
    stock: 1,
    featured: false,
  },
  {
    slug: "sanjin-ii",
    nameAr: "مَصَر الباشمينا السنجين",
    nameEn: "Sanjin Pashmina Massar",
    descriptionAr:
      "قطعة استثنائية فريدة من خط السنجين، تطريزها الأكثف يرفع قيمتها. فخامة تُهدى… وأناقة تُقتنى، بتفاصيل راقية تليق بمن يبحث عن التميز 🇴🇲",
    descriptionEn:
      "A unique, exceptional Sanjin piece — its denser embroidery sets its value. Elegance to gift, refinement to keep, in details made for those who seek distinction 🇴🇲",
    color: "midnight",
    embroidery: "kashmiri",
    priceBaisa: 175000,
    stock: 1,
    featured: false,
  },
  {
    slug: "sanjin-vvip",
    nameAr: "مَصَر الباشمينا السنجين VVIP",
    nameEn: "Sanjin Pashmina Massar VVIP",
    descriptionAr:
      "أندر قطع شالواني: مَصَر السنجين VVIP، قطعة واحدة لا تتكرر بتطريزٍ هو الأعقد في تاريخ المحل. نفدت — وستبقى في السجل شاهداً على ما تصنعه الأيادي حين لا تستعجل.",
    descriptionEn:
      "The rarest Shalwani piece: the Sanjin VVIP — a single, unrepeatable massar carrying the most intricate embroidery the house has produced. Sold out, and kept on record as proof of what unhurried hands can do.",
    color: "ink",
    embroidery: "kashmiri",
    priceBaisa: 400000,
    stock: 0,
    featured: true,
  },
];

const giftAddons = [
  { slug: "roses", nameAr: "باقة ورد", nameEn: "Bouquet of roses", priceBaisa: 3000 },
  { slug: "chocolate", nameAr: "علبة شوكولاتة", nameEn: "Box of chocolates", priceBaisa: 2500 },
];

/** Pre-alignment poetic-name products (never existed on the real account).
 * They may carry order history, so they're archived rather than deleted. */
const retiredSlugs = [
  "massar-al-layl",
  "massar-al-lazward",
  "massar-al-annabi",
  "massar-al-aaji",
  "massar-al-hisn",
  "massar-al-midad",
  "massar-al-saafa",
  "massar-al-khanjar",
  "massar-al-fajr",
  "massar-al-imara",
];

async function main() {
  for (const p of products) {
    const images = JSON.stringify([`/products/${p.slug}-1.svg`, `/products/${p.slug}-2.svg`]);
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...p, images },
      create: { ...p, images },
    });
  }
  console.log(`Seeded ${products.length} products.`);

  const retired = await prisma.product.updateMany({
    where: { slug: { in: retiredSlugs }, archived: false },
    data: { archived: true, featured: false },
  });
  if (retired.count > 0) console.log(`Archived ${retired.count} retired catalogue products.`);

  for (const a of giftAddons) {
    await prisma.giftAddon.upsert({ where: { slug: a.slug }, update: a, create: a });
  }
  console.log(`Seeded ${giftAddons.length} gift add-ons.`);

  // One-time bootstrap of the first "admin" role staff account, using the
  // legacy ADMIN_PASSWORD env var. Never overwrites an existing account,
  // so a password changed later via /admin/staff survives re-seeding.
  const bootstrapEmail = (process.env.ADMIN_EMAIL || "owner@shalwani.om").toLowerCase();
  const bootstrapPassword = process.env.ADMIN_PASSWORD;
  if (bootstrapPassword) {
    const existingCount = await prisma.adminUser.count();
    if (existingCount === 0) {
      await prisma.adminUser.create({
        data: {
          name: "Owner",
          email: bootstrapEmail,
          passwordHash: hashPassword(bootstrapPassword),
          role: "admin",
          active: true,
        },
      });
      console.log(`Bootstrapped admin account: ${bootstrapEmail}`);
    } else {
      console.log("Staff accounts already exist — skipping admin bootstrap.");
    }
  } else {
    console.warn("ADMIN_PASSWORD not set — skipped admin account bootstrap.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
