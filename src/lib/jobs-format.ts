import type { Translator } from "@/i18n/dictionaries";
import type { Job, JobNextAction, JobStatus } from "@/types";
import { formatDayAndTime, relativeDayLabel } from "@/lib/date";

/**
 * Formats the small line that sits under a job status — the thing that tells
 * the user *why this job is on the screen right now*. Falls back to the
 * application date for jobs without an explicit next action.
 */
export function formatJobNextActionLabel(
  job: Job,
  t: Translator,
  now?: Date,
): string | undefined {
  const next = job.nextAction;
  if (next) {
    return formatNextActionLine(next, t, now);
  }
  return formatStatusFallbackLine(job.status, job.createdAt, t, now);
}

function formatNextActionLine(
  next: JobNextAction,
  t: Translator,
  now?: Date,
): string {
  const when = next.time
    ? formatDayAndTime(next.date, next.time, t, now)
    : relativeDayLabel(next.date, t, now);

  switch (next.kind) {
    case "interview":
      return t("jobs.item.nextInterview", { when });
    case "follow-up":
      return t("jobs.item.nextFollowUp", { when });
    case "decision":
      return t("jobs.item.nextFollowUp", { when });
  }
}

function formatStatusFallbackLine(
  status: JobStatus,
  isoDate: string,
  t: Translator,
  now?: Date,
): string | undefined {
  const day = relativeDayLabel(isoDate, t, now);

  switch (status) {
    case "applied":
      return t("jobs.item.applied", { day });
    case "interested":
    case "interviewing":
    case "closed":
      return undefined;
  }
}

/** Localised status label for the badge in the list and the detail header. */
export function jobStatusLabel(status: JobStatus, t: Translator): string {
  switch (status) {
    case "interested":
      return t("jobs.status.interested");
    case "applied":
      return t("jobs.status.applied");
    case "interviewing":
      return t("jobs.status.interviewing");
    case "closed":
      return t("jobs.status.closed");
  }
}

/**
 * Localised next-action line for the Overview tab on a job detail page.
 * Returns the user-facing sentence, not the badge-style short label.
 */
export function formatOverviewNextStepLabel(
  next: JobNextAction,
  t: Translator,
  now?: Date,
): string {
  const when = next.time
    ? formatDayAndTime(next.date, next.time, t, now)
    : relativeDayLabel(next.date, t, now);

  switch (next.kind) {
    case "interview":
      return t("jobs.overview.nextStepInterview", { when });
    case "follow-up":
      return t("jobs.overview.nextStepFollowUp", { when });
    case "decision":
      return t("jobs.overview.nextStepDecision", { when });
  }
}