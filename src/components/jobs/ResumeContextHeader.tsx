"use client";

import { useTranslation } from "@/i18n/use-translation";
import type { JobMatch } from "@/types";

export interface ResumeContextHeaderProps {
  jobTitle: string;
  company: string;
  match: JobMatch;
}

/**
 * Resume Context — the quiet summary that opens the Resume tab.
 *
 * Shows:
 *   - Target job title + company.
 *   - Three evidence counters (Strong / Partial / Gap) derived from the
 *     job's Match. No overall percentage.
 *   - One-line note that ties the guidance back to the user's real
 *     profile + the JD.
 */
export function ResumeContextHeader({
  jobTitle,
  company,
  match,
}: ResumeContextHeaderProps) {
  const { t } = useTranslation();
  const strong = match.matches.filter((m) => m.status === "supported").length;
  const partial = match.matches.filter((m) => m.status === "partial").length;
  const gaps = match.matches.filter((m) => m.status === "gap").length;

  return (
    <header className="border-b border-line pb-8">
      <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {t("jobs.resume.context.targetJob")}
      </p>
      <h2 className="mt-3 text-title font-semibold text-ink">
        {company} · {jobTitle}
      </h2>

      <dl className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-meta text-ink-muted">
        <Counter
          count={strong}
          label={t("jobs.resume.context.evidence.strong")}
          tone="strong"
        />
        <Counter
          count={partial}
          label={t("jobs.resume.context.evidence.partial")}
          tone="partial"
        />
        <Counter
          count={gaps}
          label={t("jobs.resume.context.evidence.gap")}
          tone="gap"
        />
      </dl>

      <p className="mt-6 max-w-2xl text-meta text-ink-faint">
        {t("jobs.resume.context.note")}
      </p>
    </header>
  );
}

function Counter({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: "strong" | "partial" | "gap";
}) {
  const toneClass =
    tone === "strong"
      ? "text-ink"
      : tone === "partial"
        ? "text-ink-muted"
        : "text-ink-faint";
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${toneClass} text-body font-medium tabular-nums`}>
        {count}
      </span>
      <span className="text-ink-faint">{label}</span>
    </div>
  );
}