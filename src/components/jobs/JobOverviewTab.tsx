"use client";

import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { formatOverviewNextStepLabel } from "@/lib/jobs-format";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type { Job } from "@/types";

export interface JobOverviewTabProps {
  job: Job;
  locale: Locale;
}

/**
 * The "at a glance" view of a job — the raw JD for reference and the next
 * step that matters. Deliberately quiet so the JD Analysis tab below can do
 * the heavy lifting.
 */
export function JobOverviewTab({ job, locale }: JobOverviewTabProps) {
  const { t } = useTranslation();

  const nextStepLabel = job.nextAction
    ? formatOverviewNextStepLabel(job.nextAction, t)
    : null;
  const nextStepNote = job.nextAction?.note
    ? pick(job.nextAction.note, locale)
    : null;

  return (
    <div className="grid gap-12 md:grid-cols-12">
      <section className="md:col-span-7">
        <SectionLabel>{t("jobs.overview.jd")}</SectionLabel>
        {job.jd.trim() ? (
          <pre className="mt-5 whitespace-pre-wrap font-sans text-prose text-ink-muted">
            {job.jd}
          </pre>
        ) : (
          <p className="mt-5 text-body text-ink-faint">
            {t("jobs.overview.jdEmpty")}
          </p>
        )}
      </section>

      <aside className="md:col-span-4 md:col-start-9">
        <SectionLabel>{t("jobs.overview.nextStep")}</SectionLabel>
        <div className="mt-5 border-t border-line pt-5">
          {nextStepLabel ? (
            <div className="flex flex-col gap-2">
              <p className="text-body text-ink">{nextStepLabel}</p>
              {nextStepNote ? (
                <p className="text-meta text-ink-muted">{nextStepNote}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-body text-ink-faint">
              {t("jobs.overview.nextStepEmpty")}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}