"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { JobRequirementMatch } from "@/types";

export interface EvidenceGapsSectionProps {
  matches: JobRequirementMatch[];
  locale: Locale;
}

/**
 * Where the evidence runs out. Only renders rows with `status === "gap"`.
 * The gap copy is deliberately neutral — it never says "you lack this",
 * only that the profile does not have evidence on file yet.
 */
export function EvidenceGapsSection({
  matches,
  locale,
}: EvidenceGapsSectionProps) {
  const { t } = useTranslation();
  const gaps = matches.filter((m) => m.status === "gap");

  if (gaps.length === 0) {
    return (
      <section>
        <SectionLabel>{t("jobs.match.gaps.title")}</SectionLabel>
        <p className="mt-5 border-t border-line pt-5 text-body text-ink-muted">
          {t("jobs.match.gaps.note")}
        </p>
      </section>
    );
  }

  return (
    <section>
      <SectionLabel>{t("jobs.match.gaps.title")}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.match.gaps.note")}
      </p>

      <ul className="mt-6 flex flex-col" role="list">
        {gaps.map((m) => {
          const explanation = pick(m.explanation, locale);
          const nextAction = m.nextAction ? pick(m.nextAction, locale) : null;
          return (
            <li key={m.id} className="border-t border-line py-5">
              <p className="text-item font-semibold text-ink">
                {pick(m.requirement, locale)}
              </p>
              <p className="mt-2 text-body text-ink-muted">{explanation}</p>
              {nextAction ? (
                <p className="mt-3 text-meta text-ink-muted">
                  <span className="font-medium text-ink">
                    {t("jobs.match.nextAction")}：
                  </span>
                  {nextAction}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}