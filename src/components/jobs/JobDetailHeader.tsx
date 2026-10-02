"use client";

import Link from "next/link";
import { JobStatusTag } from "@/components/jobs/JobStatusTag";
import { ArrowLeftIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/use-translation";
import { jobStatusLabel } from "@/lib/jobs-format";
import { cn } from "@/lib/cn";
import type { Job, JobStatus } from "@/types";

export interface JobDetailHeaderProps {
  job: Job;
  display: {
    company: string;
    title: string;
    location?: string;
  };
  status: JobStatus;
  /** Notify the parent when the user picks a new status. */
  onStatusChange: (next: JobStatus) => void;
}

/**
 * Top of a job detail page. Back link, then the company / title / location
 * triplet, with a small inline status control sitting to the right. Kept as a
 * single block so the tabs below always align with the same left edge.
 */
export function JobDetailHeader({
  job,
  display,
  status,
  onStatusChange,
}: JobDetailHeaderProps) {
  const { t } = useTranslation();

  const selectStyles =
    "h-8 appearance-none rounded-pill border border-line bg-canvas-raised pl-3 pr-8 text-meta text-ink focus:border-accent focus:outline-none";

  return (
    <header>
      <Link
        href="/jobs"
        className="group inline-flex items-center gap-1.5 text-meta text-ink-muted transition-colors duration-200 hover:text-ink"
      >
        <ArrowLeftIcon className="size-3.5 transition-transform duration-200 ease-calm group-hover:-translate-x-0.5" />
        {t("jobs.back")}
      </Link>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-12">
        <div className="min-w-0 flex-1">
          <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {display.company}
          </p>
          <h1 className="mt-3 font-serif text-page font-medium text-ink">
            {display.title}
          </h1>
          {display.location ? (
            <p className="mt-3 text-body text-ink-muted">{display.location}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <label className="text-meta text-ink-faint">
            {t("jobs.detail.statusLabel")}
          </label>
          <div className="flex items-center gap-2">
            <span aria-hidden className={cn("hidden md:inline-flex")}>
              <JobStatusTag status={status} label={jobStatusLabel(status, t)} />
            </span>
            <div className="relative">
              <select
                value={status}
                onChange={(event) => onStatusChange(event.target.value as JobStatus)}
                className={selectStyles}
                aria-label={t("jobs.detail.statusLabel")}
              >
                <option value="interested">{t("jobs.status.interested")}</option>
                <option value="applied">{t("jobs.status.applied")}</option>
                <option value="interviewing">{t("jobs.status.interviewing")}</option>
                <option value="closed">{t("jobs.status.closed")}</option>
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              >
                ▾
              </span>
            </div>
          </div>
        </div>
      </div>

      {job.jobUrl ? (
        <p className="mt-6 text-meta text-ink-faint">
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            {job.jobUrl}
          </a>
        </p>
      ) : null}
    </header>
  );
}