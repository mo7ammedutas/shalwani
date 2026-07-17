import { describe, expect, it } from "vitest";
import { maxRedeemablePoints, pointsEarnedFor, pointsToBaisa } from "@/lib/loyalty";

describe("loyalty math", () => {
  it("earns rate × whole OMR of goods value", () => {
    expect(pointsEarnedFor(32_500, 1)).toBe(32); // 32.500 OMR → 32 points
    expect(pointsEarnedFor(999, 1)).toBe(0);
    expect(pointsEarnedFor(32_500, 2)).toBe(64);
    expect(pointsEarnedFor(32_500, 0)).toBe(0);
  });

  it("converts points at 100 points = 1 OMR", () => {
    expect(pointsToBaisa(100)).toBe(1_000);
    expect(pointsToBaisa(1)).toBe(10);
  });

  it("caps redemption by balance and by the discountable amount", () => {
    // Balance-bound: 50 points on a 32.500 order → all 50 usable.
    expect(maxRedeemablePoints(50, 32_500)).toBe(50);
    // Amount-bound: 10,000 points can't discount below zero on 32.500.
    expect(maxRedeemablePoints(10_000, 32_500)).toBe(3_250);
    expect(maxRedeemablePoints(0, 32_500)).toBe(0);
    expect(maxRedeemablePoints(100, 0)).toBe(0);
  });
});
