"use client";

import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/cn";

export interface MatchSummaryProps {
  strong: number;
  partial: number;
  gaps: number;
}

/**
 * Three quiet counts that sit at the top of the Match tab.
 *
 * The page is intentionally score-free: there is no overall percentage, no
 * coloured ring, no radar chart. Just three counts the reader can scan.
 */
export function MatchSummary({ strong, partial, gaps }: MatchSummaryProps) {
  const { t } = useTranslation();

  return (
    <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
      <Cell label={t("jobs.match.summary.strong")} value={strong} />
      <Cell label={t("jobs.match.summary.partial")} value={partial} />
      <Cell label={t("jobs.match.summary.gaps")} value={gaps} />
    </dl>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn("flex flex-col gap-2 px-4 py-6 md:px-6 md:py-8")}>
      <dd className="text-heading font-medium tabular-nums text-ink">
        {value}
      </dd>
      <dt className="text-meta text-ink-muted">{label}</dt>
    </div>
  );
}