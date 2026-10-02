"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import {
  AddJobDrawer,
  type AddJobForm,
} from "@/components/jobs/AddJobDrawer";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type {
  InterviewStage,
  InterviewStory,
  Job,
  LocalizedText,
  StarPart,
} from "@/types";

/**
 * My interviews — the top of the interview area. It OWNS nothing: every
 * interview case opens at /interview/[jobId] (a thin wrapper over the same
 * job data), and every mock interview runs in the one shared engine at
 * /interview/[jobId]/mock. This page only reads and links: the upcoming
 * interview, every interview in play, and the three most recent reviews.
 * No extra AI calls, no scores, no expanded prep content.
 */

export interface InterviewCenterJob {
  job: Job;
  stage: InterviewStage;
  scheduledAt: string;
  focusTitles: LocalizedText[];
  stories: InterviewStory[];
  sessionCount: number;
}

export interface InterviewCenterReview {
  jobId: string;
  company: LocalizedText;
  title: LocalizedText;
  kind: "session" | "debrief";
  date: string;
  weakPoints: LocalizedText[];
  nextFocus: LocalizedText[];
  starMissing: Partial<Record<StarPart, number>>;
}

export interface InterviewCenterViewProps {
  jobs: InterviewCenterJob[];
  reviews: InterviewCenterReview[];
  locale: Locale;
  /** Local-first mode: persists a newly added interview to this browser. */
  onAddInterview?: (form: AddJobForm) => Promise<void> | void;
}

const stageKeys: Record<InterviewStage, TranslationKey> = {
  screening: "jobs.interview.context.stage.screening",
  first_round: "jobs.interview.context.stage.first_round",
  second_round: "jobs.interview.context.stage.second_round",
  final_round: "jobs.interview.context.stage.final_round",
  other: "jobs.interview.context.stage.other",
};

export function InterviewCenterView({
  jobs,
  reviews,
  locale,
  onAddInterview,
}: InterviewCenterViewProps) {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** A — the next interview: interviewing jobs first, soonest event wins. */
  const next = useMemo(() => {
    const interviewing = jobs.filter((j) => j.job.status === "interviewing");
    const pool = interviewing.length > 0 ? interviewing : jobs;
    return [...pool].sort((a, b) =>
      (a.job.nextAction?.date ?? "9999").localeCompare(
        b.job.nextAction?.date ?? "9999",
      ),
    )[0];
  }, [jobs]);

  return (
    <div className="flex w-full flex-col gap-14">
      <header className="flex flex-col gap-5">
        <div>
          <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("nav.interview")}
          </p>
          <h1 className="mt-3 font-serif text-page font-medium text-ink">
            {t("interview.center.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-body text-ink-muted">
            {t("interview.center.note")}
          </p>
        </div>
        <div>
          <Button onClick={() => setDrawerOpen(true)}>
            {t("interview.center.add")}
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------ A · next interview */}
      {next ? (
        <section className="flex flex-col gap-4">
          <SectionLabel>{t("interview.center.next.title")}</SectionLabel>
          <div className="flex flex-col gap-4 rounded-field border border-line-strong bg-canvas-raised px-6 py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-item font-semibold text-ink">
                {pick(next.job.company, locale)} · {pick(next.job.title, locale)}
              </p>
              <span className="text-meta text-ink-faint">
                {t(stageKeys[next.stage])}
                {next.job.nextAction?.date
                  ? ` · ${next.job.nextAction.date}${
                      next.job.nextAction.time ? ` ${next.job.nextAction.time}` : ""
                    }`
                  : ""}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <ButtonLink
                href={`/interview/${next.job.id}?tab=prepare`}
                variant="primary"
              >
                {t("interview.center.next.cta")}
              </ButtonLink>
              <Link
                href={`/interview/${next.job.id}/mock`}
                className="text-meta text-ink underline-offset-4 transition-colors hover:underline"
              >
                {t("interview.center.jobs.mock")}
              </Link>
              <Link
                href={`/interview/${next.job.id}?tab=review`}
                className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {t("interview.center.jobs.review")}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <p className="text-body text-ink-faint">{t("interview.center.empty")}</p>
      )}

      {/* --------------------------------------------- B · my interviews */}
      {jobs.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionLabel>{t("interview.center.jobs.title")}</SectionLabel>
          <ul className="flex flex-col" role="list">
            {jobs.map(({ job, stage, focusTitles }) => (
              <li
                key={job.id}
                className="flex flex-col gap-3 border-t border-line py-6 first:border-t-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/interview/${job.id}`}
                    className="text-item font-semibold text-ink underline-offset-4 transition-colors hover:underline"
                  >
                    {pick(job.company, locale)} · {pick(job.title, locale)}
                  </Link>
                  <span className="text-meta text-ink-faint">
                    {t(stageKeys[stage])}
                    {job.nextAction?.date ? ` · ${job.nextAction.date}` : ""}
                  </span>
                </div>
                {focusTitles.length > 0 ? (
                  <p className="text-meta text-ink-muted">
                    {t("interview.center.review.currentFocus")} ·{" "}
                    {focusTitles.slice(0, 3).map((f) => pick(f, locale)).join(" · ")}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-5">
                  <Link
                    href={`/interview/${job.id}?tab=prepare`}
                    className="text-meta text-ink underline-offset-4 transition-colors hover:underline"
                  >
                    {t("interview.center.next.cta")}
                  </Link>
                  <Link
                    href={`/interview/${job.id}/mock`}
                    className="text-meta text-ink underline-offset-4 transition-colors hover:underline"
                  >
                    {t("interview.center.jobs.mock")}
                  </Link>
                  <Link
                    href={`/interview/${job.id}?tab=review`}
                    className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    {t("interview.center.jobs.review")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ---------------------------------------------- C · recent reviews */}
      {reviews.length > 0 ? (
        <section className="flex flex-col gap-6">
          <SectionLabel>{t("interview.center.review.title")}</SectionLabel>
          <ul className="flex flex-col" role="list">
            {reviews.slice(0, 3).map((r) => (
              <li
                key={`${r.kind}-${r.jobId}-${r.date}`}
                className="flex flex-col gap-2 border-t border-line py-5 first:border-t-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-body text-ink">
                    {pick(r.company, locale)} · {pick(r.title, locale)}
                  </p>
                  <span className="text-meta text-ink-faint">
                    {r.kind === "session"
                      ? t("interview.center.review.mockSession")
                      : t("interview.center.review.debrief")}
                    {" · "}
                    {r.date}
                  </span>
                </div>
                {r.weakPoints.length > 0 ? (
                  <p className="text-meta text-ink-muted">
                    {r.weakPoints.slice(0, 3).map((w) => pick(w, locale)).join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AddJobDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPersist={
          onAddInterview
            ? async (form) => {
                await onAddInterview(form);
                setDrawerOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
