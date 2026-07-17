import { describe, expect, it } from "vitest";
import { computeGoodsDiscount, normalizeCouponCode } from "@/lib/coupons";

describe("normalizeCouponCode", () => {
  it("uppercases and strips whitespace", () => {
    expect(normalizeCouponCode("  eid 25 ")).toBe("EID25");
    expect(normalizeCouponCode("welcome10")).toBe("WELCOME10");
  });
});

describe("computeGoodsDiscount", () => {
  it("percent: rounds to the nearest baisa", () => {
    expect(computeGoodsDiscount({ kind: "percent", value: 10 }, 32_500)).toBe(3_250);
    expect(computeGoodsDiscount({ kind: "percent", value: 5 }, 19_999)).toBe(1_000);
  });

  it("percent: clamps to 0–100", () => {
    expect(computeGoodsDiscount({ kind: "percent", value: 150 }, 10_000)).toBe(10_000);
    expect(computeGoodsDiscount({ kind: "percent", value: -5 }, 10_000)).toBe(0);
  });

  it("fixed: never exceeds the subtotal", () => {
    expect(computeGoodsDiscount({ kind: "fixed", value: 5_000 }, 32_500)).toBe(5_000);
    expect(computeGoodsDiscount({ kind: "fixed", value: 50_000 }, 32_500)).toBe(32_500);
  });

  it("freeShipping: no goods discount", () => {
    expect(computeGoodsDiscount({ kind: "freeShipping", value: 0 }, 32_500)).toBe(0);
  });
});
