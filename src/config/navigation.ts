import type { TranslationKey } from "@/i18n/dictionaries";
import type { NavIconName } from "@/types";

export interface NavItem {
  href: string;
  labelKey: TranslationKey;
  /** Shorter label for the compact mobile tab bar. */
  shortLabelKey?: TranslationKey;
  icon: NavIconName;
}

/**
 * Product navigation — three top-level destinations.
 *
 * `/jobs`, `/journey` and `/bubble` stay real routes but are intentionally
 * not top-level destinations anymore: the job pipeline lives behind each
 * interview, and journey / bubble remain reachable from the home page.
 */
export const navigationItems: NavItem[] = [
  { href: "/", labelKey: "nav.home", icon: "home" },
  { href: "/resume", labelKey: "nav.resume", icon: "opportunities" },
  { href: "/interview", labelKey: "nav.interview", icon: "interview" },
];
