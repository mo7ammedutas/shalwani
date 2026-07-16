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
 * Placeholder catalogue — realistic structure and OMR pricing, awaiting the
 * boutique's real photography and price list (README §Content). Prices are
 * integer baisa: 1 OMR = 1000 baisa.
 */
const products = [
  {
    slug: "massar-al-layl",
    nameAr: "مَصَر الليل",
    nameEn: "The Midnight Massar",
    descriptionAr:
      "كحليّ عميق كسماء الداخلية بعد العشاء، بتطريز هندسي مستوحى من شرفات القلاع. قطعة تُلبس يوم تريد أن تدخل المجلس صامتاً ويتكلم مَصَرك عنك.",
    descriptionEn:
      "Deep midnight like the Dakhiliyah sky after evening prayer, with geometric embroidery drawn from fort parapets. A piece for the day you enter the majlis silent and let your massar speak.",
    color: "midnight",
    embroidery: "geometric",
    priceBaisa: 32500,
    stock: 8,
    featured: true,
  },
  {
    slug: "massar-al-lazward",
    nameAr: "مَصَر اللازورد",
    nameEn: "The Lazuli Massar",
    descriptionAr:
      "أزرق لازوردي مشبع بتطريز كشميري متصل، تُطرَّز حاشيته على مدى ثمانية أيام كاملة. اختيار العرسان ومن يجلس في صدر المجلس.",
    descriptionEn:
      "Saturated lazuli blue with continuous Kashmiri needlework — its border alone takes eight full days. The choice of grooms and of the man seated at the head of the majlis.",
    color: "lazuli",
    embroidery: "kashmiri",
    priceBaisa: 45000,
    stock: 5,
    featured: true,
  },
  {
    slug: "massar-al-annabi",
    nameAr: "مَصَر العنّابي",
    nameEn: "The Burgundy Massar",
    descriptionAr:
      "عنّابي غامق بزخرفة نباتية دقيقة تلتفّ كسعف النخيل. لونٌ لا يلبسه إلا واثق، ويكمل الدشداشة البيضاء كما يكمل الخنجرُ الحزام.",
    descriptionEn:
      "Dark burgundy with fine floral vinework curling like palm fronds. A color worn only by the confident — it completes a white dishdasha the way a khanjar completes its belt.",
    color: "burgundy",
    embroidery: "floral",
    priceBaisa: 38500,
    stock: 6,
    featured: true,
  },
  {
    slug: "massar-al-aaji",
    nameAr: "مَصَر العاجي",
    nameEn: "The Ivory Massar",
    descriptionAr:
      "عاجيّ هادئ بحاشية مطرّزة بخيط أزرق لازوردي. الأخفّ في المجموعة وأكثرها طلباً لصلاة العيد وصباحات المناسبات.",
    descriptionEn:
      "Quiet ivory with a lazuli-thread embroidered border. The lightest piece in the collection, and the most asked-for at Eid prayers and morning occasions.",
    color: "ivory",
    embroidery: "border",
    priceBaisa: 24000,
    stock: 12,
    featured: true,
  },
  {
    slug: "massar-al-hisn",
    nameAr: "مَصَر الحِصن",
    nameEn: "The Fort Massar",
    descriptionAr:
      "رمادي أزرق كحجر حصن بهلاء، بتطريز هندسي متوازن يليق بالاستقبالات الرسمية ومجالس العمل.",
    descriptionEn:
      "Blue slate like the stone of Bahla fort, with balanced geometric embroidery suited to formal receptions and working majlis.",
    color: "slate",
    embroidery: "geometric",
    priceBaisa: 28500,
    stock: 9,
    featured: true,
  },
  {
    slug: "massar-al-midad",
    nameAr: "مَصَر المِداد",
    nameEn: "The Ink Massar",
    descriptionAr:
      "أسود مائل للزرقة كمِداد المخطوطات، بتطريز كشميري كثيف بخيط أزرق مصقول. أفخم قطعة في المجموعة، تُقتنى ولا تُستهلك.",
    descriptionEn:
      "Blue-black like manuscript ink, densely embroidered in burnished blue Kashmiri thread. The most opulent piece in the collection — acquired, not consumed.",
    color: "ink",
    embroidery: "kashmiri",
    priceBaisa: 52000,
    stock: 3,
    featured: false,
  },
  {
    slug: "massar-al-saafa",
    nameAr: "مَصَر السَّعفة",
    nameEn: "The Palm Frond Massar",
    descriptionAr:
      "عاجيّ بزخرفة نباتية خفيفة على كامل الحاشية. خيار الرجل الذي يريد حضوراً هادئاً في مجالس النهار.",
    descriptionEn:
      "Ivory with light floral vinework along the full border. For the man who wants a quiet presence in daytime gatherings.",
    color: "ivory",
    embroidery: "floral",
    priceBaisa: 26500,
    stock: 10,
    featured: false,
  },
  {
    slug: "massar-al-khanjar",
    nameAr: "مَصَر الخنجر",
    nameEn: "The Khanjar Massar",
    descriptionAr:
      "كحليّ بزخارف كشميرية تستعير انحناءة نصل الخنجر العُماني. قطعة تُهدى للوالد والعم ومن له مقام.",
    descriptionEn:
      "Midnight navy with Kashmiri motifs borrowing the curve of the Omani khanjar blade. The piece men gift to a father, an uncle, a man of standing.",
    color: "midnight",
    embroidery: "kashmiri",
    priceBaisa: 48000,
    stock: 4,
    featured: false,
  },
  {
    slug: "massar-al-fajr",
    nameAr: "مَصَر الفجر",
    nameEn: "The Daybreak Massar",
    descriptionAr:
      "رمادي أزرق فاتح بحاشية مطرّزة رصينة. المدخل الأنسب لمن يقتني أول مَصَر باشمينا له.",
    descriptionEn:
      "Light blue slate with a composed embroidered border. The right first pashmina massar for a man starting his collection.",
    color: "slate",
    embroidery: "border",
    priceBaisa: 19500,
    stock: 15,
    featured: false,
  },
  {
    slug: "massar-al-imara",
    nameAr: "مَصَر العِمارة",
    nameEn: "The Architecture Massar",
    descriptionAr:
      "عنّابي بتطريز هندسي يحاكي أقواس الأبواب العُمانية القديمة. نفدت الدفعة الأولى بالكامل، والدفعة القادمة قيد التطريز.",
    descriptionEn:
      "Burgundy with geometric embroidery echoing the arches of old Omani doorways. The first batch sold out entirely; the next is on the needle now.",
    color: "burgundy",
    embroidery: "geometric",
    priceBaisa: 35000,
    stock: 0,
    featured: false,
  },
];

const giftAddons = [
  { slug: "roses", nameAr: "باقة ورد", nameEn: "Bouquet of roses", priceBaisa: 3000 },
  { slug: "chocolate", nameAr: "علبة شوكولاتة", nameEn: "Box of chocolates", priceBaisa: 2500 },
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
