import type { Translator } from "@/i18n/dictionaries";

const MS_PER_DAY = 86_400_000;

function isoDateParts(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
}

/**
 * Whole-day difference between an ISO date (`YYYY-MM-DD`) and today.
 * Positive values are in the future. Calendar based, so it is stable across
 * render passes.
 */
export function dayOffset(isoDate: string, now: Date = new Date()): number {
  const { year, month, day } = isoDateParts(isoDate);
  if (!year || !month || !day) return 0;

  const target = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((target - today) / MS_PER_DAY);
}

/** "Today" / "Tomorrow" / "In 3 days" / "3 days ago", translated. */
export function relativeDayLabel(
  isoDate: string,
  t: Translator,
  now?: Date,
): string {
  const offset = dayOffset(isoDate, now);

  if (offset === 0) return t("time.today");
  if (offset === 1) return t("time.tomorrow");
  if (offset === -1) return t("time.yesterday");
  if (offset > 1) return t("time.inDays", { count: offset });

  return t("time.daysAgo", { count: Math.abs(offset) });
}

/** "Tomorrow · 15:00" */
export function formatDayAndTime(
  isoDate: string,
  time: string,
  t: Translator,
  now?: Date,
): string {
  return t("time.at", { day: relativeDayLabel(isoDate, t, now), time });
}
