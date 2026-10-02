"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/i18n/config";
import { createTranslator, type Translator } from "@/i18n/dictionaries";

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * `initialLocale` comes from the server (cookie, then Accept-Language), so the
 * first paint is already in the right language — no flash of the wrong one and
 * no hydration mismatch.
 *
 * When the user switches, the choice is written to localStorage (the client
 * side preference) and to a cookie (the server-side mirror), then the router
 * refreshes so any server-rendered output catches up immediately.
 */
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // localStorage is the durable client preference; if it disagrees with the
  // cookie (e.g. the cookie was cleared) the stored choice wins.
  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && stored !== initialLocale) {
      setLocaleState(stored as Locale);
      document.cookie = `${LOCALE_COOKIE}=${stored}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    }
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: createTranslator(locale) }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
