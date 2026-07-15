import type { Metadata } from "next";
import { isLocale, SOCIAL, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { verifyOrderPayment } from "@/lib/orders";
import { prisma } from "@/lib/db";
import { ButtonLink } from "@/components/ui/Button";
import { BrandSeal, IconWhatsApp } from "@/components/ui/icons";
import { ClearCartOnMount } from "@/components/shop/ClearCartOnMount";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : "ar");
  return { title: dict.success.title, robots: { index: false } };
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const [{ locale: raw }, { order }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);

  // Verify against Thawani server-side — the redirect alone is never trusted.
  const result = order ? await verifyOrderPayment(order) : null;
  const paid = result?.status === "paid";
  const isGift =
    result && result.status !== "not_found"
      ? (await prisma.order.findUnique({
          where: { orderNumber: result.orderNumber },
          select: { isGift: true },
        }))?.isGift ?? false
      : false;

  return (
    <div className="mx-auto max-w-2xl px-5 md:px-8 pt-20 pb-28 flex flex-col items-center gap-8 text-center">
      {paid ? <ClearCartOnMount /> : null}
      <BrandSeal className="size-9 text-accent" />
      <h1 className="font-heading text-3xl md:text-4xl text-text" data-testid="success-title">
        {dict.success.title}
      </h1>
      {result && result.status !== "not_found" ? (
        <p className="text-text-dim">
          {dict.success.orderNumber}:{" "}
          <span className="tabular text-surface-cream" dir="ltr" data-testid="order-number">
            {result.orderNumber}
          </span>
        </p>
      ) : null}
      <p className="max-w-prose text-text-dim leading-loose">
        {paid ? dict.success.paidBody : dict.success.pendingBody}
      </p>
      {isGift ? (
        <p className="max-w-prose text-sm text-accent-light" data-testid="gift-note">
          {dict.success.giftNote}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <ButtonLink href={`/${locale}`} variant="primary">
          {dict.success.backHome}
        </ButtonLink>
        <ButtonLink href={SOCIAL.whatsapp} variant="quiet">
          <IconWhatsApp className="size-4.5" />
          {dict.success.support}
        </ButtonLink>
      </div>
    </div>
  );
}
