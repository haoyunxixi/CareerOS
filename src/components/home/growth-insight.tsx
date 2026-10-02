"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { LocalizedText } from "@/types";

/**
 * The lightest block on the page. In a later phase this will be derived from
 * Interview Review instead of mock data.
 */
export function GrowthInsight({
  items,
  className,
}: {
  items: LocalizedText[];
  className?: string;
}) {
  const { locale, t } = useTranslation();

  return (
    <section className={className}>
      <SectionHeader title={t("section.growth")} />

      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li
            key={item.en}
            className="flex items-center gap-3 text-body text-ink-muted"
          >
            <span
              aria-hidden
              className="size-1 shrink-0 rounded-full bg-line-strong"
            />
            {pick(item, locale)}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-micro text-ink-faint">
        {t("section.growthNote")}
      </p>
    </section>
  );
}
