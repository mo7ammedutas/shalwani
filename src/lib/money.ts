import type { Locale } from "@/lib/i18n/config";

/**
 * All money in the system is stored and transmitted as an integer number
 * of Omani baisa. 1 OMR = 1000 baisa. Thawani's API requires integer
 * baisa amounts — floats never enter the pipeline.
 */

export const BAISA_PER_OMR = 1000;

export function omrToBaisa(omr: number): number {
  const baisa = Math.round(omr * BAISA_PER_OMR);
  if (!Number.isSafeInteger(baisa) || baisa < 0) {
    throw new Error(`Invalid OMR amount: ${omr}`);
  }
  return baisa;
}

export function baisaToOmr(baisa: number): number {
  assertBaisa(baisa);
  return baisa / BAISA_PER_OMR;
}

export function assertBaisa(baisa: number): void {
  if (!Number.isInteger(baisa) || baisa < 0) {
    throw new Error(`Amounts must be non-negative integer baisa, got: ${baisa}`);
  }
}

export interface CartLine {
  unitPriceBaisa: number;
  quantity: number;
}

export function lineTotalBaisa(line: CartLine): number {
  assertBaisa(line.unitPriceBaisa);
  if (!Number.isInteger(line.quantity) || line.quantity < 1) {
    throw new Error(`Invalid quantity: ${line.quantity}`);
  }
  return line.unitPriceBaisa * line.quantity;
}

export function cartTotalBaisa(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotalBaisa(line), 0);
}

/** Format an integer baisa amount as a localized OMR price string. */
export function formatOmr(baisa: number, locale: Locale): string {
  assertBaisa(baisa);
  const amount = baisa / BAISA_PER_OMR;
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    // Keep Western digits in both scripts: prices must be unambiguous
    numberingSystem: "latn",
  }).format(amount);
  return locale === "ar" ? `${formatted} ر.ع` : `OMR ${formatted}`;
}
