import "server-only";
import { prisma } from "@/lib/db";
import type { Coupon } from "@prisma/client";

/**
 * Coupon validation and discount math. All amounts are integer baisa; the
 * discount applies to the goods subtotal (products + gift add-ons), never
 * to VAT — VAT is computed on the discounted goods amount by the caller.
 * "freeShipping" zeroes the shipping fee instead of discounting goods.
 */

export type CouponRejection =
  | "not_found"
  | "inactive"
  | "expired"
  | "exhausted"
  | "below_minimum";

export interface CouponQuote {
  coupon: Coupon;
  /** Baisa off the goods subtotal (0 for freeShipping coupons). */
  goodsDiscountBaisa: number;
  /** True when the shipping fee should be waived entirely. */
  freeShipping: boolean;
}

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Pure discount math, exported separately for unit testing. */
export function computeGoodsDiscount(
  coupon: Pick<Coupon, "kind" | "value">,
  goodsSubtotalBaisa: number,
): number {
  if (coupon.kind === "percent") {
    const pct = Math.min(Math.max(coupon.value, 0), 100);
    return Math.round((goodsSubtotalBaisa * pct) / 100);
  }
  if (coupon.kind === "fixed") {
    return Math.min(Math.max(coupon.value, 0), goodsSubtotalBaisa);
  }
  return 0; // freeShipping
}

/** Validates a code against the database and the order's goods subtotal.
 * Does NOT consume a use — consumption happens only when the order is
 * actually created (and is finalized on payment). */
export async function quoteCoupon(
  rawCode: string,
  goodsSubtotalBaisa: number,
  now = new Date(),
): Promise<{ ok: true; quote: CouponQuote } | { ok: false; reason: CouponRejection }> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, reason: "not_found" };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return { ok: false, reason: "not_found" };
  if (!coupon.active) return { ok: false, reason: "inactive" };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, reason: "expired" };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: "exhausted" };
  }
  if (goodsSubtotalBaisa < coupon.minOrderBaisa) return { ok: false, reason: "below_minimum" };

  return {
    ok: true,
    quote: {
      coupon,
      goodsDiscountBaisa: computeGoodsDiscount(coupon, goodsSubtotalBaisa),
      freeShipping: coupon.kind === "freeShipping",
    },
  };
}
