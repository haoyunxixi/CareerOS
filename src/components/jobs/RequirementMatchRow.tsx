"use client";

import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type {
  Evidence,
  JobRequirementMatch,
  RequirementStatus,
} from "@/types";

export interface RequirementMatchRowProps {
  match: JobRequirementMatch;
  evidence: Evidence[];
  locale: Locale;
}

/**
 * One line of the requirement × evidence table.
 *
 * - Top row: requirement (left) + status + importance tags (right).
 * - Middle: one-line explanation, always honest about what the profile has or
 *   doesn't have.
 * - Bottom: evidence list (each item references a real profile entry).
 */
export function RequirementMatchRow({
  match,
  evidence,
  locale,
}: RequirementMatchRowProps) {
  const { t } = useTranslation();
  const requirementText = pick(match.requirement, locale);
  const explanation = pick(match.explanation, locale);
  const nextAction = match.nextAction ? pick(match.nextAction, locale) : null;

  return (
    <article className="border-t border-line py-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-item font-semibold text-ink">{requirementText}</p>
          <p className="mt-2 text-meta text-ink-faint">
            {t(`jobs.match.importance.${match.importance}`)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusTag status={match.status} label={t(`jobs.match.status.${match.status}`)} />
        </div>
      </header>

      <p className="mt-4 text-body text-ink-muted">{explanation}</p>

      {nextAction ? (
        <p className="mt-3 text-meta text-ink-muted">
          <span className="font-medium text-ink">{t("jobs.match.nextAction")}：</span>
          {nextAction}
        </p>
      ) : null}

      <EvidenceList match={match} evidence={evidence} locale={locale} />
    </article>
  );
}

function StatusTag({
  status,
  label,
}: {
  status: RequirementStatus;
  label: string;
}) {
  const variant = status === "supported" ? "soft" : "outline";
  return <Tag variant={variant}>{label}</Tag>;
}

function EvidenceList({
  match,
  evidence,
  locale,
}: {
  match: JobRequirementMatch;
  evidence: Evidence[];
  locale: Locale;
}) {
  const { t } = useTranslation();
  const items = evidence.filter((e) => match.evidenceIds.includes(e.id));

  if (match.status === "gap" || items.length === 0) {
    return (
      <p className="mt-4 border-t border-line pt-4 text-meta text-ink-faint">
        {t("jobs.match.evidenceGapNote")}
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-micro uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {t("jobs.match.evidence")}
      </p>
      <ul className={cn("mt-3 flex flex-col gap-2")} role="list">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 text-body text-ink"
          >
            <span
              aria-hidden
              className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
            />
            <span>{pick(item.title, locale)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}