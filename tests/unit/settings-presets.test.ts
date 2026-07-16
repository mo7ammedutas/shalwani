import { describe, expect, it } from "vitest";
import { ACCENT_PRESETS, DEFAULT_ACCENT_PRESET, isAccentPreset } from "@/lib/settings-presets";

describe("accent presets", () => {
  it("accepts every declared preset key", () => {
    for (const key of Object.keys(ACCENT_PRESETS)) {
      expect(isAccentPreset(key)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isAccentPreset("neon")).toBe(false);
    expect(isAccentPreset("")).toBe(false);
  });

  it("the default preset is a valid, declared preset", () => {
    expect(isAccentPreset(DEFAULT_ACCENT_PRESET)).toBe(true);
    expect(ACCENT_PRESETS[DEFAULT_ACCENT_PRESET]).toBeDefined();
  });

  it("every preset defines a full accent trio as hex colours", () => {
    for (const preset of Object.values(ACCENT_PRESETS)) {
      expect(preset.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(preset.accentLight).toMatch(/^#[0-9a-f]{6}$/i);
      expect(preset.accentDark).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
