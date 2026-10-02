"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { useTranslation } from "@/i18n/use-translation";
import { relativeDayLabel } from "@/lib/date";
import { pick } from "@/lib/localize";
import type { Opportunity } from "@/types";

/**
 * A list, not a set of cards: hairline rows that stay scannable and let the
 * role name carry the hierarchy. Each row will open the Job Workspace later.
 */
export function OpportunityPreview({
  opportunities,
  className,
}: {
  opportunities: Opportunity[];
  className?: string;
}) {
  const { locale, t } = useTranslation();

  return (
    <section className={className}>
      <SectionHeader
        title={t("section.opportunities")}
        action={{ label: t("section.viewAll"), href: "/jobs" }}
      />

      <ul className="mt-4 divide-y divide-line border-t border-line">
        {opportunities.map((opportunity) => {
          const isInterview = opportunity.kind === "interview";

          return (
            <li key={opportunity.id}>
              <Link
                href="/jobs"
                className="-mx-3 flex flex-col gap-1.5 rounded-field px-3 py-4 transition-colors duration-200 hover:bg-canvas-sunken sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <span className="min-w-0">
                  <span className="block text-meta text-ink-muted">
                    {pick(opportunity.company, locale)}
                  </span>
                  <span className="mt-1 block text-item font-semibold text-ink">
                    {pick(opportunity.role, locale)}
                  </span>
                </span>

                <span className="flex items-center gap-2 text-meta text-ink-muted sm:shrink-0">
                  {isInterview ? (
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full bg-accent"
                    />
                  ) : null}
                  {isInterview && opportunity.stage
                    ? `${pick(opportunity.stage, locale)} · ${relativeDayLabel(opportunity.date, t)}`
                    : t("opportunities.applied", {
                        day: relativeDayLabel(opportunity.date, t),
                      })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
