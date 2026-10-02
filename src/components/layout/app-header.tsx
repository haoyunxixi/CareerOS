"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { iconRegistry } from "@/components/icons";
import { contentFrame } from "@/components/layout/container";
import { AuthEntry } from "@/components/layout/auth-entry";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { navigationItems } from "@/config/navigation";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/cn";
import { isActivePath } from "@/lib/navigation";

/**
 * Global header. Wordmark left, navigation centred, language and identity
 * right — no sidebar, no chrome competing with the page.
 *
 * The compact bar below is the same navigation reshaped for small screens.
 */
export function AppHeader() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas">
        <div
          className={cn(
            contentFrame,
            "grid h-14 grid-cols-[1fr_auto] items-center gap-4 md:h-16 md:grid-cols-[1fr_auto_1fr]",
          )}
        >
          <Link
            href="/"
            className="text-body font-medium tracking-[-0.01em] text-ink"
          >
            {t("common.appName")}
          </Link>

          <nav
            aria-label={t("nav.primary")}
            className="hidden self-stretch md:flex md:items-stretch"
          >
            {navigationItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center px-3 text-body transition-colors duration-200",
                    active ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {t(item.labelKey)}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-[2px] rounded-pill bg-accent transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-3 md:gap-4">
            <LanguageSwitcher />
            <AuthEntry />
          </div>
        </div>
      </header>

      <nav
        aria-label={t("nav.compact")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas md:hidden"
      >
        <ul className="grid grid-cols-3">
          {navigationItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = iconRegistry[item.icon];
            const labelKey = item.shortLabelKey ?? item.labelKey;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-micro transition-colors duration-200",
                    active ? "text-ink" : "text-ink-faint",
                  )}
                >
                  <Icon className="size-5" />
                  <span>{t(labelKey)}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-4 top-0 h-[2px] rounded-pill bg-accent transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
