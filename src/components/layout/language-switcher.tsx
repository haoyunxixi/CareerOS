"use client";

import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/cn";

/**
 * Segmented language control. Lives in the global header so it is available on
 * every page, and never competes with navigation for attention.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className="flex items-center gap-0.5 rounded-pill border border-line bg-canvas-raised p-0.5"
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        const { short, full } = LOCALE_LABELS[option];

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={active}
            title={full}
            className={cn(
              "h-7 rounded-pill px-2.5 text-micro font-medium transition-colors duration-200",
              active
                ? "bg-ink text-canvas"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {short}
          </button>
        );
      })}
    </div>
  );
}
