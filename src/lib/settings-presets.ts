/** Accent palette presets — plain constants (no server-only) so both the
 * settings form and the root layout's inline style tag can import them.
 * Each preset overrides only the accent trio; the neutral tokens (bg,
 * surface, text) and the burgundy "secondary" punctuation colour stay
 * fixed so every preset remains inside the same designed system. */

export const ACCENT_PRESETS = {
  midnight: { accent: "#12182a", accentLight: "#3c5f94", accentDark: "#0e1424" },
  burgundy: { accent: "#5e1a24", accentLight: "#8b2635", accentDark: "#3d1017" },
  emerald: { accent: "#1f4a38", accentLight: "#2f6b52", accentDark: "#122e22" },
  graphite: { accent: "#22262e", accentLight: "#3a3f4b", accentDark: "#14171c" },
} as const;

export type AccentPreset = keyof typeof ACCENT_PRESETS;

export const DEFAULT_ACCENT_PRESET: AccentPreset = "midnight";

export function isAccentPreset(value: string): value is AccentPreset {
  return value in ACCENT_PRESETS;
}
