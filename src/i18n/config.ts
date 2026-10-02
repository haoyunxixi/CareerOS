/**
 * Locale configuration.
 *
 * Adding a new language is two steps: append it to `LOCALES` below and create
 * `src/i18n/locales/<locale>.ts`. The `Dictionary` type then forces every other
 * locale file to stay in sync at compile time.
 */

export const LOCALES = ["zh-CN", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Mirrors the client-side choice so the server can render the right language. */
export const LOCALE_COOKIE = "careeros_locale";

export const LOCALE_STORAGE_KEY = "careeros.locale";

/** Short labels are proper nouns, so they are shared across every locale. */
export const LOCALE_LABELS: Record<Locale, { short: string; full: string }> = {
  "zh-CN": { short: "中", full: "中文" },
  en: { short: "EN", full: "English" },
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Picks a locale from an `Accept-Language` header, honouring q-values.
 *
 * This runs on the server, which is what makes the first paint correct: the
 * browser sends the same preference it exposes as `navigator.language`, but we
 * get it before rendering instead of after hydration.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const entries = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qParam ? Number(qParam.trim().slice(2)) : 1;

      return {
        tag: tag.trim().toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 1,
      };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of entries) {
    // Any Chinese variant currently maps to Simplified Chinese.
    if (tag.startsWith("zh")) return "zh-CN";
    if (tag.startsWith("en")) return "en";
  }

  return DEFAULT_LOCALE;
}
