import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { cartTotalBaisa } from "@/lib/money";
import { createCheckoutSession, isMockMode, payRedirectUrl } from "@/lib/thawani";
import { newOrderNumber } from "@/lib/orders";
import { isLocale } from "@/lib/i18n/config";
import { SHIPPING_FEE_BAISA } from "@/lib/shipping";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getSettings, vatRateFraction } from "@/lib/settings";

const checkoutSchema = z.object({
  locale: z.string().refine(isLocale),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(20),
    email: z.string().trim().email().optional().or(z.literal("")),
  }),
  address: z.string().trim().min(4).max(500),
  notes: z.string().trim().max(1000).optional(),
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
  // Keep in sync with ShippingZone in @/lib/shipping.
  shippingZone: z.enum(["oman", "gulf"]).default("oman"),
  isGift: z.boolean().default(false),
  giftMessage: z.string().trim().max(500).optional(),
  recipientName: z.string().trim().max(120).optional(),
  giftAddonIds: z.array(z.string().min(1)).max(10).default([]),
});

export async function POST(request: Request) {
  let input: z.infer<typeof checkoutSchema>;
  try {
    input = checkoutSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Re-price everything from the database — client prices are never trusted.
  const products = await prisma.product.findMany({
    where: { slug: { in: input.items.map((i) => i.slug) } },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const lines = [];
  for (const item of input.items) {
    const product = bySlug.get(item.slug);
    if (!product) {
      return NextResponse.json({ error: "unknown_product", slug: item.slug }, { status: 400 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: "insufficient_stock", slug: item.slug }, { status: 409 });
    }
    lines.push({ product, quantity: item.quantity });
  }

  const productsTotal = cartTotalBaisa(
    lines.map((l) => ({ unitPriceBaisa: l.product.priceBaisa, quantity: l.quantity })),
  );

  // Gift add-ons are only honoured when isGift is set, and only active,
  // currently-published add-ons — never trust client-supplied names/prices.
  const addons =
    input.isGift && input.giftAddonIds.length > 0
      ? await prisma.giftAddon.findMany({
          where: { id: { in: input.giftAddonIds }, active: true },
        })
      : [];
  if (input.isGift && addons.length !== new Set(input.giftAddonIds).size) {
    return NextResponse.json({ error: "unknown_gift_addon" }, { status: 400 });
  }
  const addonsTotal = addons.reduce((sum, a) => sum + a.priceBaisa, 0);

  const settings = await getSettings();
  const shippingFee =
    input.shippingZone === "gulf" ? settings.gulfShippingFeeBaisa : SHIPPING_FEE_BAISA.oman;
  // VAT applies to goods + gift add-ons, not to shipping — standard practice.
  const vatBaisa = Math.round((productsTotal + addonsTotal) * vatRateFraction(settings));
  const totalBaisa = productsTotal + addonsTotal + shippingFee + vatBaisa;

  // Identity comes from the session when signed in — never from the form —
  // so an order always attaches to the real account and its contact fields
  // can't be hijacked by someone typing a stranger's phone number.
  const loggedInCustomer = await getCurrentCustomer();
  let customer;
  if (loggedInCustomer) {
    customer = await prisma.customer.update({
      where: { id: loggedInCustomer.id },
      data: {
        name: input.customer.name,
        email: input.customer.email || loggedInCustomer.email,
      },
    });
  } else {
    const existing = await prisma.customer.findUnique({ where: { phone: input.customer.phone } });
    // A registered account already owns this phone number — guest checkout
    // must not silently overwrite that account's stored profile.
    customer =
      existing?.passwordHash != null
        ? existing
        : await prisma.customer.upsert({
            where: { phone: input.customer.phone },
            update: { name: input.customer.name, email: input.customer.email || null },
            create: {
              name: input.customer.name,
              phone: input.customer.phone,
              email: input.customer.email || null,
            },
          });
  }

  const orderNumber = newOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      status: "pending",
      totalBaisa,
      shippingAddress: input.address,
      notes: input.notes || null,
      locale: input.locale,
      isGift: input.isGift,
      giftMessage: input.isGift ? input.giftMessage || null : null,
      recipientName: input.isGift ? input.recipientName || null : null,
      shippingZone: input.shippingZone,
      shippingFeeBaisa: shippingFee,
      giftAddonsTotalBaisa: addonsTotal,
      vatBaisa,
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          unitPriceBaisa: l.product.priceBaisa,
        })),
      },
      giftAddons: {
        create: addons.map((a) => ({
          addonId: a.id,
          nameAr: a.nameAr,
          nameEn: a.nameEn,
          priceBaisa: a.priceBaisa,
        })),
      },
    },
  });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const successUrl = `${siteUrl}/${input.locale}/checkout/success?order=${orderNumber}`;
  const cancelUrl = `${siteUrl}/${input.locale}/checkout/cancel?order=${orderNumber}`;

  const productLines = lines.map((l) => ({
    name: (input.locale === "ar" ? l.product.nameAr : l.product.nameEn).slice(0, 40),
    quantity: l.quantity,
    unit_amount: l.product.priceBaisa, // integer baisa
  }));
  const addonLines = addons.map((a) => ({
    name: (input.locale === "ar" ? a.nameAr : a.nameEn).slice(0, 40),
    quantity: 1,
    unit_amount: a.priceBaisa,
  }));
  const shippingLine =
    shippingFee > 0
      ? [
          {
            name: input.locale === "ar" ? "شحن خليجي" : "Gulf shipping",
            quantity: 1,
            unit_amount: shippingFee,
          },
        ]
      : [];
  const vatLine =
    vatBaisa > 0
      ? [
          {
            name:
              input.locale === "ar"
                ? `ضريبة القيمة المضافة (${settings.vatRatePercent}٪)`
                : `VAT (${settings.vatRatePercent}%)`,
            quantity: 1,
            unit_amount: vatBaisa,
          },
        ]
      : [];

  try {
    const session = await createCheckoutSession({
      clientReferenceId: orderNumber,
      products: [...productLines, ...addonLines, ...shippingLine, ...vatLine],
      successUrl,
      cancelUrl,
      metadata: { orderNumber, phone: input.customer.phone },
    });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { thawaniSessionId: session.session_id },
      }),
      prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          sessionId: session.session_id,
          status: "created",
          rawPayload: JSON.stringify(session),
        },
      }),
    ]);

    const redirectUrl = isMockMode() ? successUrl : payRedirectUrl(session.session_id);
    return NextResponse.json({ redirectUrl, orderNumber });
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } });
    console.error("Thawani session creation failed:", err);
    return NextResponse.json({ error: "payment_init_failed" }, { status: 502 });
  }
}
