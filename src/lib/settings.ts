import "server-only";
import { prisma } from "@/lib/db";
import { SOCIAL } from "@/lib/i18n/config";
import { SHIPPING_FEE_BAISA } from "@/lib/shipping";
import { omrToBaisa } from "@/lib/money";
import { DEFAULT_ACCENT_PRESET, isAccentPreset, type AccentPreset } from "@/lib/settings-presets";

export interface SiteSettings {
  logoUrl: string; // "" = use the text wordmark
  heroImageUrl: string; // homepage hero backdrop; "" = bundled placeholder art
  storyTeaserImageUrl: string; // homepage story-teaser photo; "" = placeholder
  /** One image per /story section, in order. "" = no image for that
   * section (renders as a centered text-only block — the site's original
   * closing-section treatment, so an empty slot is a valid design choice
   * and not just "not yet uploaded"). */
  storyImageUrls: string[];
  accentPreset: AccentPreset;
  contactEmail: string;
  whatsappUrl: string;
  vatRatePercent: number; // 0–100, e.g. 5 for 5%
  gulfShippingFeeBaisa: number;
  loyaltyPointsPerOmr: number; // earn rate; 0 disables the loyalty program
}

const DEFAULTS: SiteSettings = {
  logoUrl: "",
  heroImageUrl: "",
  storyTeaserImageUrl: "",
  storyImageUrls: [],
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
  const storyImagesRaw = map.get("storyImageUrls");

  let storyImageUrls = DEFAULTS.storyImageUrls;
  if (storyImagesRaw) {
    try {
      const parsed: unknown = JSON.parse(storyImagesRaw);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
        storyImageUrls = parsed;
      }
    } catch {
      // malformed row — fall back to the default silently
    }
  }

  return {
    logoUrl: map.get("logoUrl") || DEFAULTS.logoUrl,
    heroImageUrl: map.get("heroImageUrl") || DEFAULTS.heroImageUrl,
    storyTeaserImageUrl: map.get("storyTeaserImageUrl") || DEFAULTS.storyTeaserImageUrl,
    storyImageUrls,
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
