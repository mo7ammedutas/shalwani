# شالواني | Shalwani — Information Architecture

بوتيك عُماني فاخر لمَصَر (شيلان) الباشمينا الرجالية المطرّزة يدوياً.
Register: **Brand-led e-commerce** — التصميم هو المنتج، لكن السلة والدفع يجب أن يعملا كمتجر حقيقي.

---

## 1. Sitemap (bilingual: `/ar/*` default, `/en/*`)

```
/                         → redirect به middleware إلى /ar (أو لغة الزائر المحفوظة)
/{locale}                 الرئيسية Home
/{locale}/shop            المجموعة (فلترة: اللون، نوع التطريز، السعر + ترتيب)
/{locale}/shop/[slug]     صفحة المنتج (معرض صور + Lightbox، السعر OMR، التوفر، أضف للسلة)
/{locale}/cart            سلة الشراء (صفحة كاملة + Drawer جانبي من الهيدر)
/{locale}/checkout        نموذج بيانات الشحن → إنشاء Thawani Session → تحويل
/{locale}/checkout/success?order=…   تأكيد الطلب (تحقق Server-side من حالة الجلسة)
/{locale}/checkout/cancel?order=…    فشل/إلغاء الدفع + إعادة المحاولة
/{locale}/story           قصتنا / الحرفية
/{locale}/bespoke         اطلب قطعة مخصصة (نموذج → طلب bespoke في قاعدة البيانات)
/{locale}/contact         تواصل معنا (انستغرام، واتساب، نموذج بسيط)
/{locale}/style-guide     دليل التصميم الداخلي (ألوان/خطوط/أزرار/مكوّنات المتجر)
/{locale}/[404]           صفحة 404 بنفس الهوية
```

### API (Route Handlers)

```
POST /api/checkout            يتحقق من السلة server-side، ينشئ Order(pending) + Thawani Session، يعيد رابط الدفع
GET  /api/checkout/verify     يتحقق من حالة الجلسة مع Thawani API مباشرة ويحدّث الطلب (يُستدعى من صفحة success)
POST /api/webhooks/thawani    Webhook: تأكيد الدفع من الخادم، تحديث paid + خصم المخزون + سجل PaymentTransaction
POST /api/bespoke             حفظ طلب التصميم المخصص
POST /api/contact             حفظ رسالة تواصل
GET  /sitemap.xml, /robots.txt
```

---

## 2. Page anatomy

### الرئيسية Home
1. **Hero** — خلفية داكنة بعمق (نسيج + خط أفق مقوّس)، الشعار بالخط الكوفي، جملة تعريفية، زرّان: «استكشف المجموعة» (أساسي) + «تواصل عبر واتساب» (ثانوي هادئ).
2. **قصتنا (مختصر)** — تخطيط غير متساوٍ: صورة كبيرة يسار/نص يمين (ينعكس في RTL)، فاصل hairline.
3. **مجموعة مختارة** — شبكة غير متساوية (قطعة بارزة كبيرة + أربع بطاقات)، ليست 3 أعمدة متطابقة.
4. **لماذا شالواني** — ثلاث حجج (الخامة، التطريز اليدوي، الطابع العُماني الرجالي) بتخطيط قائمة رقمية أفقية لا بطاقات أيقونات.
5. **اقتباس/توصية** — شريط Testimonial بخط Amiri/Playfair كبير، هادئ.
6. **Footer** — أعمدة روابط + انستغرام + واتساب + حقوق النشر.

### المتجر Shop
- شريط فلاتر أعلى الشبكة (اللون / نوع التطريز / نطاق السعر) + ترتيب (الأحدث، السعر ↑↓).
- شبكة بطاقات منتج بنسبة أبعاد ثابتة 4:5، hover هادئ (رفع بسيط + تظليل حافة).

### صفحة المنتج
- عمودان: معرض صور (صورة رئيسية + مصغرات، Lightbox عند النقر) | التفاصيل (الاسم بالخطين، السعر بالريال، الوصف، نوع التطريز، حالة التوفر، «أضِف إلى السلة»).
- قسم «قِطَع قريبة» أسفل الصفحة.

### السلة / الدفع
- Drawer جانبي فوري من أيقونة الهيدر + صفحة `/cart` كاملة.
- Checkout: نموذج (الاسم، الهاتف، العنوان/نقطة الاستلام، ملاحظات) → POST `/api/checkout` → تحويل لصفحة ثواني الآمنة.

### العناصر الثابتة في كل الصفحات
- Header شفاف → `--color-surface` عند التمرير، شعار، تنقل، مبدّل لغة، أيقونة سلة بعدّاد.
- زر واتساب عائم (دعم فقط) — أسفل البداية المنطقية (inset-inline-end).

---

## 3. Component tree

```
components/
  layout/   Header, NavLinks, LanguageSwitcher, CartButton, Footer, WhatsAppFloat
  ui/       Button, Input, Select, Textarea, SectionHeading, Divider, Price, Badge, Lightbox
  sections/ Hero, StoryTeaser, FeaturedCollection, WhyShalwani, TestimonialBand
  shop/     ProductCard, ProductGrid, ShopFilters, ProductGallery, AddToCart,
            CartDrawer, CartLineItem, CartSummary, CheckoutForm
lib/
  i18n/     config.ts, dictionaries (ar.ts, en.ts), getDictionary
  cart.tsx  CartProvider (localStorage + reducer)
  money.ts  OMR ↔ Baisa (عدد صحيح)، تنسيق العملة ثنائي اللغة
  thawani.ts createCheckoutSession, getSession, payRedirectUrl (+ وضع Mock)
  db.ts     Prisma client singleton
```

---

## 4. Database schema (Prisma)

- **Product** — slug, nameAr/nameEn, descriptionAr/En, color (slug) + colorAr/En, embroidery (slug) + embroideryAr/En, priceBaisa (Int — 1 OMR = 1000 بيسة), images (JSON), stock, featured, createdAt.
- **Customer** — name, phone, email?, createdAt (يُنشأ/يُطابق عند الطلب بالهاتف).
- **Order** — orderNumber (SHW-XXXXXX), customerId, status (`pending|paid|failed|cancelled`), totalBaisa, shippingAddress, notes, locale, thawaniSessionId, createdAt/updatedAt.
- **OrderItem** — orderId, productId, quantity, unitPriceBaisa (سعر لحظة الشراء).
- **PaymentTransaction** — orderId, provider(`thawani`), sessionId, status, rawPayload (JSON للتدقيق), createdAt.
- **BespokeRequest** — name, phone, preferences, notes, status(`new|quoted|paid`).

قاعدة التطوير المحلي: SQLite (يعمل فوراً بلا خادم). للإنتاج: PostgreSQL — تغيير `provider` + `DATABASE_URL` وإعادة توليد migration (موثّق في README).

---

## 5. Payment flow (Thawani — Sandbox أولاً)

1. Checkout form → `POST /api/checkout` بعناصر السلة فقط (IDs + كميات) — **الأسعار تُحسب من قاعدة البيانات، لا من العميل**.
2. الخادم ينشئ Order(pending) ثم `POST {THAWANI_BASE_URL}/checkout/session` بالمبالغ **بالبيسة (Int)** مع success_url / cancel_url تحملان orderNumber.
3. تحويل العميل إلى `https://…thawani.om/pay/{session_id}?key={publishable}`.
4. success page → `GET /api/checkout/verify` يستعلم حالة الجلسة من Thawani API مباشرة (لا اعتماد على redirect) → paid + خصم المخزون.
5. `POST /api/webhooks/thawani` مسار تأكيد إضافي من الخادم، كل محاولة تُسجَّل في PaymentTransaction.
6. `THAWANI_MOCK=1` أثناء الاختبار: تدفق كامل بلا استدعاء خارجي.
