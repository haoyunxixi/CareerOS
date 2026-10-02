"use client";

import Link from "next/link";
import { JobStatusTag } from "@/components/jobs/JobStatusTag";
import { ArrowRightIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/cn";
import type { Job } from "@/types";

export interface JobListItemProps {
  job: Job;
  /** Pre-localised display strings. */
  display: {
    company: string;
    title: string;
    location?: string;
  };
  /** Pre-localised status label. */
  statusLabel: string;
  /** Pre-formatted next-action chip. `undefined` hides it. */
  nextActionLabel?: string;
}

/**
 * One row in the jobs list. Hairline-separated, clickable as a whole. We keep
 * the chrome light: status + next-action chip in the top-right, company as
 * the only bold line, role below. No card box — hairlines and a hover wash
 * are enough.
 */
export function JobListItem({
  job,
  display,
  statusLabel,
  nextActionLabel,
}: JobListItemProps) {
  const { t } = useTranslation();

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={cn(
        "group flex items-start justify-between gap-4 border-b border-line py-6 transition-colors duration-200",
        "hover:bg-canvas-sunken/60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-item font-semibold text-ink">{display.company}</p>
        <p className="mt-2 text-body text-ink-muted">
          {display.title}
          {display.location ? (
            <>
              <span className="mx-1.5 text-ink-faint">·</span>
              <span>{display.location}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 text-right">
        <JobStatusTag status={job.status} label={statusLabel} />
        {nextActionLabel ? (
          <span className="text-meta text-ink-muted">{nextActionLabel}</span>
        ) : null}
        <span
          aria-hidden
          className="inline-flex items-center text-micro text-ink-faint opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          {t("jobs.detail.tab.overview")}
          <ArrowRightIcon className="ml-1 size-3" />
        </span>
      </div>
    </Link>
  );
}