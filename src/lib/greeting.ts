import type { TranslationKey } from "@/i18n/dictionaries";

export type DayPart = "morning" | "afternoon" | "evening";

const GREETING_KEYS: Record<DayPart, TranslationKey> = {
  morning: "greeting.morning",
  afternoon: "greeting.afternoon",
  evening: "greeting.evening",
};

/**
 * Computed on the server and passed down, so the greeting never disagrees
 * between render passes.
 */
export function getDayPart(date: Date = new Date()): DayPart {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function greetingKey(dayPart: DayPart): TranslationKey {
  return GREETING_KEYS[dayPart];
}
