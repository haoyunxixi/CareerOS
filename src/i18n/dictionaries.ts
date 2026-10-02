import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { en } from "@/i18n/locales/en";
import { zhCN } from "@/i18n/locales/zh-CN";

/**
 * Every interface string must exist in the reference dictionary, which makes
 * `TranslationKey` a compile-time guarantee rather than a convention.
 */
export type Dictionary = Record<keyof typeof en, string>;

export type TranslationKey = keyof typeof en;

export type Translator = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string;

/**
 * Loosely typed on purpose: the dictionary is looked up at runtime, and the
 * fallback path stays meaningful even though every locale file is complete.
 */
export const dictionaries: Record<Locale, Partial<Dictionary>> = {
  en,
  "zh-CN": zhCN,
};

export function createTranslator(locale: Locale): Translator {
  const dictionary = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const fallback = dictionaries[DEFAULT_LOCALE];

  return (key, vars) => {
    const template = dictionary[key] ?? fallback[key] ?? key;
    if (!vars) return template;

    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = vars[name];
      return value === undefined ? match : String(value);
    });
  };
}
