import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCoupon } from "@/lib/coupons";

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotalBaisa: z.number().int().min(0),
});

/** Preview a coupon for the checkout UI. Purely informational — the real
 * discount is recomputed server-side in /api/checkout at order time. */
export async function POST(request: Request) {
  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await quoteCoupon(input.code, input.subtotalBaisa);
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    code: result.quote.coupon.code,
    kind: result.quote.coupon.kind,
    discountBaisa: result.quote.goodsDiscountBaisa,
    freeShipping: result.quote.freeShipping,
  });
}
