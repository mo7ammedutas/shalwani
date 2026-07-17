import "server-only";
import { prisma } from "@/lib/db";
import { SOCIAL } from "@/lib/i18n/config";
import { SHIPPING_FEE_BAISA } from "@/lib/shipping";
import { omrToBaisa } from "@/lib/money";
import { DEFAULT_ACCENT_PRESET, isAccentPreset, type AccentPreset } from "@/lib/settings-presets";

export interface SiteSettings {
  logoUrl: string; // "" = use the text wordmark
  accentPreset: AccentPreset;
  contactEmail: string;
  whatsappUrl: string;
  vatRatePercent: number; // 0–100, e.g. 5 for 5%
  gulfShippingFeeBaisa: number;
  loyaltyPointsPerOmr: number; // earn rate; 0 disables the loyalty program
}

const DEFAULTS: SiteSettings = {
  logoUrl: "",
  accentPreset: DEFAULT_ACCENT_PRESET,
  contactEmail: "",
  whatsappUrl: SOCIAL.whatsapp,
  vatRatePercent: 0,
  gulfShippingFeeBaisa: SHIPPING_FEE_BAISA.gulf,
  loyaltyPointsPerOmr: 1,
};

/** Reads the Setting key/value rows into a typed, defaulted object. Missing
 * or malformed rows fall back silently — settings are merchandising
 * preferences, never load-bearing for correctness. */
export async function getSettings(): Promise<SiteSettings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const accentRaw = map.get("accentPreset");
  const vatRaw = map.get("vatRatePercent");
  const gulfRaw = map.get("gulfShippingFeeOmr");
  const loyaltyRaw = map.get("loyaltyPointsPerOmr");

  return {
    logoUrl: map.get("logoUrl") || DEFAULTS.logoUrl,
    accentPreset: accentRaw && isAccentPreset(accentRaw) ? accentRaw : DEFAULTS.accentPreset,
    contactEmail: map.get("contactEmail") || DEFAULTS.contactEmail,
    whatsappUrl: map.get("whatsappUrl") || DEFAULTS.whatsappUrl,
    vatRatePercent: vatRaw && !Number.isNaN(Number(vatRaw)) ? Number(vatRaw) : DEFAULTS.vatRatePercent,
    gulfShippingFeeBaisa:
      gulfRaw && !Number.isNaN(Number(gulfRaw))
        ? omrToBaisa(Number(gulfRaw))
        : DEFAULTS.gulfShippingFeeBaisa,
    loyaltyPointsPerOmr:
      loyaltyRaw && !Number.isNaN(Number(loyaltyRaw))
        ? Math.max(0, Math.floor(Number(loyaltyRaw)))
        : DEFAULTS.loyaltyPointsPerOmr,
  };
}

export function vatRateFraction(settings: Pick<SiteSettings, "vatRatePercent">): number {
  return settings.vatRatePercent / 100;
}
