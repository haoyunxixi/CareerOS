"use client";

import { JobListItem } from "@/components/jobs/JobListItem";
import { useTranslation } from "@/i18n/use-translation";
import { formatJobNextActionLabel, jobStatusLabel } from "@/lib/jobs-format";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { Job } from "@/types";

export interface JobListProps {
  jobs: Job[];
  locale: Locale;
  className?: string;
}

/**
 * Stacked rows. No card box — a hairline between rows is enough to give the
 * list rhythm without making it feel like a dashboard.
 */
export function JobList({ jobs, locale, className }: JobListProps) {
  const { t } = useTranslation();

  if (jobs.length === 0) {
    return (
      <p className="mt-12 border-t border-line pt-12 text-body text-ink-muted">
        {t("jobs.empty")}
      </p>
    );
  }

  return (
    <ul className={className} role="list">
      <li
        aria-hidden
        className="border-t border-line"
      />
      {jobs.map((job) => {
        const display = {
          company: pick(job.company, locale),
          title: pick(job.title, locale),
          location: job.location ? pick(job.location, locale) : undefined,
        };
        const statusLabel = jobStatusLabel(job.status, t);
        const nextActionLabel = formatJobNextActionLabel(job, t);

        return (
          <li key={job.id}>
            <JobListItem
              job={job}
              display={display}
              statusLabel={statusLabel}
              nextActionLabel={nextActionLabel}
            />
          </li>
        );
      })}
    </ul>
  );
}