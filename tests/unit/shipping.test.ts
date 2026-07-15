import { describe, expect, it } from "vitest";
import { isShippingZone, SHIPPING_FEE_BAISA, SHIPPING_ZONES } from "@/lib/shipping";

describe("shipping zones", () => {
  it("Oman delivery carries no checkout-time fee", () => {
    expect(SHIPPING_FEE_BAISA.oman).toBe(0);
  });

  it("Gulf shipping carries a positive integer baisa fee", () => {
    expect(Number.isInteger(SHIPPING_FEE_BAISA.gulf)).toBe(true);
    expect(SHIPPING_FEE_BAISA.gulf).toBeGreaterThan(0);
  });

  it("validates zone strings", () => {
    expect(isShippingZone("oman")).toBe(true);
    expect(isShippingZone("gulf")).toBe(true);
    expect(isShippingZone("mars")).toBe(false);
    expect(isShippingZone("")).toBe(false);
  });

  it("every declared zone has a fee entry", () => {
    for (const zone of SHIPPING_ZONES) {
      expect(SHIPPING_FEE_BAISA[zone]).toBeDefined();
    }
  });
});
