import "server-only";
import { prisma } from "@/lib/db";

/**
 * Loyalty points. Earn: N points per whole OMR of goods value on each paid
 * order (rate configurable in Settings, default 1). Redeem: points convert
 * to a checkout discount at a fixed 100 points = 1.000 OMR (1 point =
 * 10 baisa) — a 1% cashback equivalent at the default earn rate.
 *
 * Points are deducted when the order is created (so two checkouts can't
 * promise the same balance) and refunded if the order fails or is
 * cancelled. Earning happens only when payment is confirmed.
 */

export const POINT_VALUE_BAISA = 10;

export function pointsToBaisa(points: number): number {
  return points * POINT_VALUE_BAISA;
}

/** How many points a paid order earns: rate × whole OMR of goods value
 * (after discounts, excluding shipping and VAT). */
export function pointsEarnedFor(goodsBaisaAfterDiscount: number, ratePerOmr: number): number {
  if (ratePerOmr <= 0) return 0;
  return Math.floor(goodsBaisaAfterDiscount / 1000) * ratePerOmr;
}

/** The most points a customer can spend on this order: capped by balance
 * and by the discountable amount (never discount below zero). */
export function maxRedeemablePoints(balance: number, discountableBaisa: number): number {
  return Math.max(0, Math.min(balance, Math.floor(discountableBaisa / POINT_VALUE_BAISA)));
}

/** Deducts points inside the given transaction list builder — caller
 * composes into prisma.$transaction. */
export function redeemOps(customerId: string, orderId: string, points: number) {
  return [
    prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { decrement: points } },
    }),
    prisma.loyaltyTransaction.create({
      data: { customerId, orderId, kind: "redeem", points: -points },
    }),
  ];
}

/** Refunds previously redeemed points when an order fails/cancels.
 * Idempotent: checks for an existing refund row first. */
export async function refundRedeemedPoints(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, redeemedPoints: true },
  });
  if (!order || order.redeemedPoints <= 0) return;
  const already = await prisma.loyaltyTransaction.findFirst({
    where: { orderId, kind: "adjust" },
  });
  if (already) return;
  await prisma.$transaction([
    prisma.customer.update({
      where: { id: order.customerId },
      data: { loyaltyPoints: { increment: order.redeemedPoints } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        customerId: order.customerId,
        orderId,
        kind: "adjust",
        points: order.redeemedPoints,
      },
    }),
  ]);
}

/** Awards earn-points for a paid order exactly once. */
export async function awardPointsForOrder(orderId: string, ratePerOmr: number): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      customerId: true,
      totalBaisa: true,
      shippingFeeBaisa: true,
      vatBaisa: true,
    },
  });
  if (!order) return;
  const goods = order.totalBaisa - order.shippingFeeBaisa - order.vatBaisa;
  const points = pointsEarnedFor(goods, ratePerOmr);
  if (points <= 0) return;
  const already = await prisma.loyaltyTransaction.findFirst({
    where: { orderId, kind: "earn" },
  });
  if (already) return;
  await prisma.$transaction([
    prisma.customer.update({
      where: { id: order.customerId },
      data: { loyaltyPoints: { increment: points } },
    }),
    prisma.loyaltyTransaction.create({
      data: { customerId: order.customerId, orderId, kind: "earn", points },
    }),
  ]);
}
