"use client";

import { useTranslation } from "@/i18n/use-translation";
import { greetingKey, type DayPart } from "@/lib/greeting";

/**
 * Opens the page with a greeting and one sentence. Two lines only: the
 * greeting is metadata-sized so the serif headline is unambiguously the
 * first thing read. The whitespace to the right of the headline is part
 * of the design — no decoration fills it.
 */
export function Greeting({ name, dayPart }: { name: string; dayPart: DayPart }) {
  const { t } = useTranslation();

  return (
    <section>
      <p className="text-meta text-ink-muted">
        {t(greetingKey(dayPart), { name })}
      </p>
      <h1 className="mt-3 max-w-[40rem] font-serif text-hero font-medium text-ink">
        {t("home.headline")}
      </h1>
    </section>
  );
}
