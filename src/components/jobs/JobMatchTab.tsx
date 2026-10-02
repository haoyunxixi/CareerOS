"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { MatchSummary } from "@/components/jobs/MatchSummary";
import { RequirementMatchRow } from "@/components/jobs/RequirementMatchRow";
import { StrengthsSection } from "@/components/jobs/StrengthsSection";
import { EvidenceGapsSection } from "@/components/jobs/EvidenceGapsSection";
import { MatchNextActions } from "@/components/jobs/MatchNextActions";
import { useTranslation } from "@/i18n/use-translation";
import type { Locale } from "@/i18n/config";
import type { JobMatch } from "@/types";

export interface JobMatchTabProps {
  match: JobMatch;
  locale: Locale;
}

/**
 * Match tab content. Three big beats:
 *   1. Summary counts (no overall score, ever).
 *   2. Strengths + Gaps.
 *   3. Every requirement mapped to its evidence row.
 *   4. Suggested next actions.
 *
 * A short link to `/profile` sits at the very top so the reader knows the
 * source of truth is editable.
 */
export function JobMatchTab({ match, locale }: JobMatchTabProps) {
  const { t } = useTranslation();

  const strongCount = match.matches.filter((m) => m.status === "supported").length;
  const partialCount = match.matches.filter((m) => m.status === "partial").length;
  const gapsCount = match.matches.filter((m) => m.status === "gap").length;

  return (
    <div className="flex flex-col gap-14">
      <header className="max-w-2xl">
        <h2 className="text-title font-semibold text-ink">
          {t("jobs.match.title")}
        </h2>
        <p className="mt-3 text-meta text-ink-faint">{t("jobs.match.note")}</p>
        <p className="mt-4">
          <Link
            href="/profile"
            className="group inline-flex items-center gap-1 text-meta text-accent transition-colors hover:text-ink"
          >
            {t("jobs.match.openProfile")}
            <ArrowRightIcon className="size-3.5 transition-transform duration-200 ease-calm group-hover:translate-x-0.5" />
          </Link>
        </p>
      </header>

      <MatchSummary strong={strongCount} partial={partialCount} gaps={gapsCount} />

      <StrengthsSection evidence={match.strengths} locale={locale} />

      <RequirementsSection match={match} locale={locale} />

      <EvidenceGapsSection matches={match.matches} locale={locale} />

      <MatchNextActions actions={match.nextActions} locale={locale} />
    </div>
  );
}

function RequirementsSection({
  match,
  locale,
}: {
  match: JobMatch;
  locale: Locale;
}) {
  return (
    <section>
      <ul className="flex flex-col" role="list">
        {match.matches.map((m) => (
          <RequirementMatchRow
            key={m.id}
            match={m}
            evidence={match.evidence}
            locale={locale}
          />
        ))}
      </ul>
    </section>
  );
}