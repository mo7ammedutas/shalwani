import { describe, expect, it } from "vitest";
import {
  BAISA_PER_OMR,
  baisaToOmr,
  cartTotalBaisa,
  formatOmr,
  lineTotalBaisa,
  omrToBaisa,
} from "@/lib/money";

describe("OMR ↔ baisa conversion", () => {
  it("converts whole rials", () => {
    expect(omrToBaisa(1)).toBe(1000);
    expect(omrToBaisa(45)).toBe(45000);
  });

  it("converts fractional rials without float drift", () => {
    expect(omrToBaisa(12.5)).toBe(12500);
    expect(omrToBaisa(19.5)).toBe(19500);
    expect(omrToBaisa(0.001)).toBe(1);
    // classic float trap: 0.1 + 0.2
    expect(omrToBaisa(0.1 + 0.2)).toBe(300);
  });

  it("round-trips", () => {
    for (const baisa of [1, 999, 1000, 32500, 45000, 12345]) {
      expect(omrToBaisa(baisaToOmr(baisa))).toBe(baisa);
    }
  });

  it("rejects negative and non-integer baisa", () => {
    expect(() => baisaToOmr(-5)).toThrow();
    expect(() => baisaToOmr(10.5)).toThrow();
    expect(() => omrToBaisa(-1)).toThrow();
  });

  it("uses the 1:1000 Omani subdivision", () => {
    expect(BAISA_PER_OMR).toBe(1000);
  });
});

describe("cart totals", () => {
  it("computes a line total", () => {
    expect(lineTotalBaisa({ unitPriceBaisa: 32500, quantity: 2 })).toBe(65000);
  });

  it("computes a multi-line cart total", () => {
    expect(
      cartTotalBaisa([
        { unitPriceBaisa: 32500, quantity: 2 },
        { unitPriceBaisa: 19500, quantity: 1 },
      ]),
    ).toBe(84500);
  });

  it("rejects zero/negative/fractional quantities", () => {
    expect(() => lineTotalBaisa({ unitPriceBaisa: 1000, quantity: 0 })).toThrow();
    expect(() => lineTotalBaisa({ unitPriceBaisa: 1000, quantity: -1 })).toThrow();
    expect(() => lineTotalBaisa({ unitPriceBaisa: 1000, quantity: 1.5 })).toThrow();
  });

  it("rejects fractional baisa amounts (Thawani requires integers)", () => {
    expect(() => lineTotalBaisa({ unitPriceBaisa: 1000.5, quantity: 1 })).toThrow();
  });
});

describe("price formatting", () => {
  it("formats Arabic prices with Western digits and ر.ع", () => {
    expect(formatOmr(32500, "ar")).toBe("32.500 ر.ع");
  });

  it("formats English prices with the OMR prefix", () => {
    expect(formatOmr(32500, "en")).toBe("OMR 32.500");
  });

  it("always shows three baisa digits", () => {
    expect(formatOmr(45000, "en")).toBe("OMR 45.000");
    expect(formatOmr(1, "en")).toBe("OMR 0.001");
  });
});
