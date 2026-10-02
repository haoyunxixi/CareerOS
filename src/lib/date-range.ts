import type { LocalizedText } from "@/types";
import type { Translator } from "@/i18n/dictionaries";

/**
 * Format a `YYYY-MM` start/end pair for an experience card.
 *
 *  - "2025-07 → 2025-12"   when both are present.
 *  - "2024-09 → 现在"      when end is omitted (i.e. "Present").
 *
 * Kept here so both the read-only profile cards and the edit form can use the
 * same display rule.
 */
export function formatDateRange(
  startDate: string,
  endDate: string | undefined,
  t: Translator,
  presentLabel?: string,
): LocalizedText {
  const present = presentLabel ?? t("profile.experience.endDatePresent");
  const end = endDate ? endDate : present;

  return {
    "zh-CN": `${startDate} → ${end}`,
    en: `${startDate} → ${end}`,
  };
}