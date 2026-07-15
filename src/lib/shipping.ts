/** Shared client+server module — plain constants, no server-only imports,
 * so the checkout form can compute a live total preview before submit. */

export type ShippingZone = "oman" | "gulf";

export const SHIPPING_ZONES: ShippingZone[] = ["oman", "gulf"];

/** Integer baisa. Oman delivery is arranged/quoted on dispatch (no charge
 * at checkout); Gulf (GCC) shipping carries a flat cross-border fee. */
export const SHIPPING_FEE_BAISA: Record<ShippingZone, number> = {
  oman: 0,
  gulf: 5000, // 5.000 OMR — adjust here as real courier rates are set
};

export function isShippingZone(value: string): value is ShippingZone {
  return (SHIPPING_ZONES as string[]).includes(value);
}
