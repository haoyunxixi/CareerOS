"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { Evidence } from "@/types";

export interface StrengthsSectionProps {
  evidence: Evidence[];
  locale: Locale;
}

/**
 * "Your strongest evidence" — the 2–4 evidence items the user should lead
 * with when they talk to this job. We render them as a hairline-separated
 * list; no scores, no progress bars.
 */
export function StrengthsSection({ evidence, locale }: StrengthsSectionProps) {
  const { t } = useTranslation();

  if (evidence.length === 0) return null;

  return (
    <section>
      <SectionLabel>{t("jobs.match.strengths.title")}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.match.strengths.note")}
      </p>

      <ul className="mt-6 flex flex-col" role="list">
        {evidence.map((item) => (
          <li
            key={item.id}
            className="border-t border-line py-5"
          >
            <p className="text-item font-semibold text-ink">
              {pick(item.title, locale)}
            </p>
            {item.description ? (
              <p className="mt-2 text-meta text-ink-muted">
                {pick(item.description, locale)}
              </p>
            ) : null}
            {item.skills.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2" role="list">
                {item.skills.map((skill, i) => (
                  <li
                    key={i}
                    className="text-meta text-ink-faint"
                  >
                    · {pick(skill, locale)}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}