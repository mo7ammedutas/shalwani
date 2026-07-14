import type { Locale } from "./config";
import ar from "./ar";
import en from "./en";

export type Dictionary = typeof ar;

const dictionaries: Record<Locale, Dictionary> = { ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Tiny template helper: fill("{count} pieces", { count: 4 }) */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}
