# شالواني | Shalwani

متجر إلكتروني فاخر ثنائي اللغة (عربي RTL / إنجليزي LTR) لمَصَر الباشمينا العُماني الرجالي المطرّز يدوياً، مبني بـ Next.js App Router مع سلة شراء، إتمام طلب، وتكامل كامل مع بوابة الدفع العُمانية **ثواني (Thawani Pay)** بالريال العُماني.

**Stack**: Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · Prisma ORM (SQLite للتطوير / PostgreSQL للإنتاج) · Playwright + Vitest + axe-core

> معمارية المعلومات الكاملة (خريطة الموقع، تشريح الصفحات، مخطط قاعدة البيانات، تدفق الدفع) موثّقة في [`sitemap.md`](./sitemap.md).

---

## التشغيل المحلي

```bash
npm install                 # يشغّل prisma generate تلقائياً (postinstall)
cp .env.example .env        # القيم الافتراضية تعمل فوراً: SQLite + وضع Thawani التجريبي Mock
npx prisma migrate dev      # ينشئ قاعدة البيانات المحلية dev.db
npm run db:seed             # يزرع 10 منتجات نموذجية ثنائية اللغة
npm run dev                 # http://localhost:3000 → يحوّل تلقائياً إلى /ar
```

| أمر | الوظيفة |
|---|---|
| `npm run dev` | خادم التطوير |
| `npm run build` / `npm start` | بناء وتشغيل الإنتاج |
| `npm run lint` | ESLint |
| `npm test` | اختبارات الوحدة (Vitest): حساب الإجمالي، تحويل البيسة، تنسيق العملة |
| `npm run test:e2e` | Playwright: الرئيسية، مبدّل اللغة، السلة، الفلترة، تدفق الدفع كاملاً، فحص a11y عبر axe |
| `npm run db:seed` | إعادة زرع البيانات (upsert — يعيد المخزون لقيمه الأصلية) |
| `npm run db:studio` | متصفح قاعدة البيانات Prisma Studio |
| `npm run placeholders` | إعادة توليد صور الـ SVG المؤقتة |

صفحة معاينة نظام التصميم (داخلية): `/ar/style-guide` و `/en/style-guide`.

---

## متغيرات البيئة

| المتغير | الوصف |
|---|---|
| `DATABASE_URL` | `file:./dev.db` محلياً، أو رابط PostgreSQL في الإنتاج |
| `NEXT_PUBLIC_SITE_URL` | الأصل المطلق للموقع — يُستخدم في روابط نجاح/إلغاء الدفع وSEO |
| `THAWANI_BASE_URL` | `https://uatcheckout.thawani.om/api/v1` تجريبي · `https://checkout.thawani.om/api/v1` إنتاج |
| `THAWANI_SECRET_KEY` | المفتاح السري من لوحة تحكم ثواني (خادم فقط، لا يصل للمتصفح أبداً) |
| `THAWANI_PUBLISHABLE_KEY` | المفتاح المعلن — يُستخدم فقط في رابط صفحة الدفع المستضافة |
| `THAWANI_MOCK` | `1` = تدفق شراء كامل بدون استدعاء ثواني (للتطوير والاختبارات) · احذفه أو ضعه `0` للدفع الحقيقي |

`.env` في `.gitignore` — لا يُرفع أي مفتاح إلى git إطلاقاً.

---

## بوابة الدفع ثواني (Thawani Pay)

### كيف يعمل التدفق

1. عند «ادفع الآن» يرسل المتصفح **قائمة المنتجات والكميات فقط** إلى `POST /api/checkout` — الأسعار تُحسب دائماً من قاعدة البيانات، لا من العميل.
2. الخادم ينشئ الطلب بحالة `pending`، ثم ينشئ Thawani Checkout Session بالمبالغ **بالبيسة كأعداد صحيحة** (1 ر.ع = 1000 بيسة؛ مثال: 12.500 ر.ع → `12500`).
3. يُحوَّل العميل إلى صفحة الدفع الآمنة المستضافة لدى ثواني (`{origin}/pay/{session_id}?key={publishable}`) — لا يوجد أي نموذج بطاقات مخصص في الموقع.
4. بعد الدفع يعود العميل إلى `checkout/success?order=…` حيث **يتحقق الخادم من حالة الجلسة مع API ثواني مباشرة** (`GET /checkout/session/{id}`) — لا اعتماد على إعادة التوجيه وحدها. عند التأكيد: الطلب `paid`، يُخصم المخزون (مرة واحدة فقط — العملية idempotent)، وتُسجَّل معاملة.
5. `POST /api/webhooks/thawani` قناة تأكيد إضافية من خادم ثواني: تُخزَّن الحمولة كاملة في `PaymentTransaction` للتدقيق، ثم يُعاد التحقق من الحالة server-to-server (لا ثقة بمحتوى الـ webhook نفسه).
6. الإلغاء/الفشل → صفحة `checkout/cancel` مع إبقاء السلة كما هي وخيار إعادة المحاولة. كل محاولة دفع مسجلة في جدول `PaymentTransaction`.

### الحصول على حساب تاجر

1. سجّل كتاجر عبر [thawani.om](https://thawani.om) (يتطلب سجلاً تجارياً عُمانياً وحساباً بنكياً محلياً).
2. بعد التفعيل تحصل من لوحة التحكم على زوجي مفاتيح منفصلين: **UAT (تجريبي)** و**Production** — لكل منهما Secret Key وPublishable Key.
3. ضع مفاتيح UAT في `.env` مع `THAWANI_BASE_URL` التجريبي و`THAWANI_MOCK="0"` لاختبار الدفع الفعلي على بيئة Sandbox (توفر ثواني بطاقات اختبار في توثيقها: [developer.thawani.om](https://developer.thawani.om/) و[docs.thawani.om](https://docs.thawani.om/)).
4. في لوحة التحكم اضبط رابط الـ Webhook على `https://your-domain.com/api/webhooks/thawani`.

### الانتقال من Sandbox إلى الإنتاج

في بيئة الاستضافة (وليس في الكود):

```
THAWANI_BASE_URL="https://checkout.thawani.om/api/v1"
THAWANI_SECRET_KEY="<مفتاح الإنتاج السري>"
THAWANI_PUBLISHABLE_KEY="<مفتاح الإنتاج المعلن>"
THAWANI_MOCK="0"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

ثم نفّذ طلب شراء حقيقياً صغيراً وتأكد من: تحديث الطلب إلى `paid`، خصم المخزون، ووصول الـ webhook (راجع جدول `PaymentTransaction`).

---

## قاعدة البيانات

الجداول: `Product` (ترجمة ar/en، السعر بالبيسة `Int`، صور JSON، مخزون) · `Customer` · `Order` (+`orderNumber` بصيغة `SHW-XXXXXXXX`) · `OrderItem` (يجمّد سعر لحظة الشراء) · `PaymentTransaction` (سجل تدقيق كامل) · `BespokeRequest` · `ContactMessage`.

### التحويل إلى PostgreSQL للإنتاج

1. في `prisma/schema.prisma` غيّر `provider = "sqlite"` إلى `provider = "postgresql"`.
2. اضبط `DATABASE_URL` على قاعدة Postgres (Neon أو Supabase أو Vercel Postgres).
3. احذف مجلد `prisma/migrations` (migrations SQLite غير متوافقة) ثم `npx prisma migrate dev --name init` لتوليد migrations جديدة نظيفة.
4. `npm run db:seed` لزرع الكتالوج.

النماذج نفسها متوافقة مع المحرّكين بلا أي تعديل.

---

## النشر (Vercel موصى بها)

الموقع يحتاج خادم Node (API Routes + Prisma)، لذا Vercel أنسب من أي استضافة ثابتة:

1. ارفع المستودع إلى GitHub واستورده في Vercel (يتعرف على Next.js تلقائياً؛ أمر البناء الافتراضي يكفي لأن `build` يشغّل `prisma generate`).
2. أنشئ قاعدة Postgres (Vercel Postgres / Neon / Supabase) ونفّذ خطوات التحويل أعلاه.
3. أدخل كل متغيرات البيئة (الجدول أعلاه) في إعدادات المشروع — ابدأ بمفاتيح UAT ثم بدّل للإنتاج.
4. اضبط webhook ثواني على نطاقك النهائي.

**بديل**: أي خادم Node/VPS يعمل عبر `npm run build && npm start` خلف Nginx — مناسب إن أردت إبقاء البيانات داخل عُمان.

ملاحظات أداء مضمّنة في الكود: خطوط Google محمّلة عبر `next/font` مع `display: swap`، الصور عبر `next/image` بأحجام متجاوبة وlazy loading، حركة تحترم `prefers-reduced-motion`، وSEO كامل (meta ثنائية اللغة، Open Graph، `sitemap.xml` بالبدائل اللغوية، `robots.txt`، وSchema.org `Product` بصيغة JSON-LD في صفحات المنتجات).

---

## استبدال البيانات المؤقتة بالحقيقية

| ماذا | أين |
|---|---|
| **صور المنتجات** | ضع الصور الحقيقية في `public/products/` وحدّث حقل `images` لكل منتج (عبر `prisma/seed.ts` أو Prisma Studio). النسبة المعتمدة في كل الواجهات 4:5. صور الـ SVG الحالية مولّدة من `scripts/generate-placeholders.mjs` |
| **الأسعار والمخزون** | `prisma/seed.ts` (بالبيسة: 32.500 ر.ع = `32500`) أو مباشرة عبر `npm run db:studio` |
| **أسماء ووصف المنتجات** | حقول `nameAr/nameEn/descriptionAr/descriptionEn` في seed أو Studio |
| **صورة الـ Hero** | `public/hero.svg` — استبدلها بصورة/فيديو حقيقي وعدّل `src/components/sections/Hero.tsx` |
| **التوصية (Testimonial)** | `testimonial` في `src/lib/i18n/ar.ts` و`en.ts` |
| **نصوص الموقع كلها** | قاموسا المحتوى: `src/lib/i18n/ar.ts` و`src/lib/i18n/en.ts` |
| **الألوان والخطوط** | `src/app/globals.css` (كتلة `@theme` — كل الألوان custom properties، لا قيم متناثرة) |
| **روابط التواصل** | `SOCIAL` في `src/lib/i18n/config.ts` |

طلبات «قطعة مخصصة» ورسائل التواصل تُحفظ في جدولي `BespokeRequest` و`ContactMessage` — راجعها عبر `npm run db:studio` (يمكن لاحقاً ربطها ببريد أو Telegram webhook).

---

## بنية المشروع

```
src/
  proxy.ts                    توجيه اللغات (/ → /ar، ويحقن x-locale header)
  app/
    layout.tsx                Root: الخطوط الستة + <html lang dir>
    [locale]/                 كل الصفحات: الرئيسية، shop، shop/[slug]، cart،
                              checkout (+success/cancel)، story، bespoke،
                              contact، style-guide، not-found
    api/                      checkout، checkout/verify، webhooks/thawani،
                              bespoke، contact
  components/
    ui/                       Button، Field، Price، SectionHeading، icons
    layout/                   Header، Footer، WhatsAppFloat
    sections/                 Hero، StoryTeaser، FeaturedCollection،
                              WhyShalwani، TestimonialBand، النماذج
    shop/                     ProductCard، ProductGallery (+Lightbox)،
                              ShopFilters، AddToCart، CartDrawer،
                              CartPageContent، CheckoutForm
  lib/
    i18n/                     القواميس والإعدادات
    cart.tsx                  حالة السلة (Context + localStorage)
    money.ts                  البيسة ↔ الريال (أعداد صحيحة فقط)
    thawani.ts                عميل Thawani API (+ وضع Mock)
    orders.ts                 التحقق من الدفع وخصم المخزون (idempotent)
prisma/                       المخطط، migrations، seed
tests/unit + tests/e2e        Vitest + Playwright + axe
```
