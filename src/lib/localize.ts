import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { LocalizedText } from "@/types";

/**
 * Picks the string for the active locale from a piece of content that carries
 * every translation. Content lives in `src/data`; interface strings live in the
 * dictionary.
 */
export function pick(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text[DEFAULT_LOCALE];
}
